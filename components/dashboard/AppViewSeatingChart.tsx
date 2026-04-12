'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';
import { useSeatingLayoutNav } from '@/context/SeatingLayoutNavContext';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';
import EditLayoutModal from '@/components/modals/EditLayoutModal';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import PointsAwardedConfirmationModal from '@/components/modals/PointsAwardedConfirmationModal';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import IconAddPlus from '@/components/iconsCustom/iconAddPlus';
import IconPresentationBoard from '@/components/iconsCustom/iconPresentationBoard';
import IconDocumentClock from '@/components/iconsCustom/iconDocumentClock';
import CanvasToolbar from '@/components/dashboard/CanvasToolbar';
import ClassPointLogSlidePanel from '@/components/dashboard/ClassPointLogSlidePanel';
import { useClassPointLog } from '@/hooks/useClassPointLog';
import { useDashboardToolbarInset } from '@/hooks/useDashboardToolbarInset';

interface SeatingChart {
  id: string;
  name: string;
  class_id: string;
  created_at: string;
  show_grid?: boolean;
  show_objects?: boolean;
  layout_orientation?: string;
}

interface SeatingGroup {
  id: string;
  name: string;
  seating_chart_id: string;
  sort_order: number;
  group_columns: number;
  group_rows?: number;
  position_x?: number;
  position_y?: number;
  created_at: string;
}

interface StudentSeatAssignment {
  seating_group_id: string;
  seat_index: number | null;
  students: Student | null;
}

/** Per-group assignment with seat_index for fixed-slot grid (matches editor). */
type GroupAssignment = { student: Student; seat_index: number };

interface AppViewSeatingChartProps {
  classId: string;
  /** Shared class roster from parent — avoids duplicate Supabase fetch when toggling grid/seating. */
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  isMultiSelectMode?: boolean;
  selectedStudentIds?: string[];
  onSelectStudent?: (studentId: string) => void;
}

export default function AppViewSeatingChart({
  classId,
  students,
  setStudents,
  isMultiSelectMode = false,
  selectedStudentIds = [],
  onSelectStudent,
}: AppViewSeatingChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SeatingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupAssignments, setGroupAssignments] = useState<Map<string, GroupAssignment[]>>(new Map());
  const [groupPositions, setGroupPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const setSeatingLayoutData = useSeatingLayoutNav();
  const [layoutToDelete, setLayoutToDelete] = useState<{ id: string; name: string } | null>(null);
  const [layoutToEdit, setLayoutToEdit] = useState<{ id: string; name: string } | null>(null);
  const [isEditLayoutModalOpen, setIsEditLayoutModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAwardPointsModalOpen, setIsAwardPointsModalOpen] = useState(false);
  const [selectedGroupStudentIds, setSelectedGroupStudentIds] = useState<string[]>([]);
  /** Set in onAwardComplete before IDs are cleared; read in handlePointsAwarded for optimistic points. */
  const pendingAwardStudentIdsRef = useRef<string[] | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [awardInfo, setAwardInfo] = useState<{
    studentAvatar: string;
    studentFirstName: string;
    points: number;
    categoryName: string;
    categoryIcon?: string;
  } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  // View settings from database
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showObjects, setShowObjects] = useState<boolean>(true);
  const [layoutOrientation, setLayoutOrientation] = useState<string>('Left');
  const [isTeacherView, setIsTeacherView] = useState(false);

  const toolbarInset = useDashboardToolbarInset();
  const {
    isPointLogOpen,
    setIsPointLogOpen,
    isPointLogLoading,
    pointLogError,
    logPage,
    setLogPage,
    rowsPerPage,
    setRowsPerPage,
    logTotalCount,
    totalPages,
    safeLogPage,
    pagedPointLogRows,
  } = useClassPointLog(classId, students);

  const applyLayoutViewSettings = useCallback((data: {
    show_grid?: boolean | null;
    show_objects?: boolean | null;
    layout_orientation?: string | null;
  }) => {
    setShowGrid(data.show_grid ?? true);
    setShowObjects(data.show_objects ?? true);
    setLayoutOrientation(data.layout_orientation ?? 'Left');
  }, []);

  // Persist teacher-view preference per class so it survives temporary remounts.
  useEffect(() => {
    if (!classId) return;
    const storageKey = `seatingChart_teacherView_${classId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsTeacherView(stored === 'true');
    }
  }, [classId]);

  const fetchLayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();
      
      const { data, error: fetchError } = await supabase
        .from('seating_charts')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching seating charts:', fetchError);
        setError('Failed to load seating charts. Please try again.');
        return;
      }

      if (data) {
        setLayouts(data);
        // Auto-select the first layout if available
        if (data.length > 0 && !selectedLayoutId) {
          setSelectedLayoutId(data[0].id);
        }
      } else {
        setLayouts([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching seating charts:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [classId, selectedLayoutId]);

  // Fetch layouts from Supabase
  useEffect(() => {
    if (classId) {
      fetchLayouts();
    }
  }, [classId, fetchLayouts]);

  // Store selected layout ID in localStorage and dispatch event when it changes
  useEffect(() => {
    if (selectedLayoutId && classId) {
      // Store in localStorage with classId as key to avoid conflicts
      const storageKey = `seatingChart_selectedLayout_${classId}`;
      localStorage.setItem(storageKey, selectedLayoutId);
      
      // Dispatch event with layout ID for BottomNav to pick up
      window.dispatchEvent(new CustomEvent('seatingChartLayoutSelected', { 
        detail: { layoutId: selectedLayoutId, classId } 
      }));
    }
  }, [selectedLayoutId, classId]);

  // Provide layout data to left nav (for seating view)
  useEffect(() => {
    setSeatingLayoutData({
      layouts,
      selectedLayoutId,
      onSelectLayout: setSelectedLayoutId,
      onAddLayout: () => setIsCreateModalOpen(true),
      onEditLayout: handleEditLayout,
      onDeleteLayout: handleDeleteLayout,
      isLoadingLayouts: isLoading,
    });
    return () => setSeatingLayoutData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are stable enough; avoid running on every render
  }, [layouts, selectedLayoutId, isLoading, setSeatingLayoutData]);

  const applyOptimisticPointsDelta = useCallback((studentIds: string[], delta: number) => {
    if (studentIds.length === 0 || delta === 0 || !Number.isFinite(delta)) return;
    const idSet = new Set(studentIds);
    setStudents((prev) =>
      prev.map((s) => (idSet.has(s.id) ? { ...s, points: (s.points ?? 0) + delta } : s))
    );
    setGroupAssignments((prev) => {
      const next = new Map<string, GroupAssignment[]>();
      prev.forEach((assignments, groupId) => {
        next.set(
          groupId,
          assignments.map((ga) =>
            idSet.has(ga.student.id)
              ? { ...ga, student: { ...ga.student, points: (ga.student.points ?? 0) + delta } }
              : ga
          )
        );
      });
      return next;
    });
  }, [setStudents]);

  const fetchGroups = useCallback(async () => {
    if (!selectedLayoutId) return;

    try {
      setIsLoadingGroups(true);
      const supabase = createClient();
      
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('seating_groups')
        .select('*')
        .eq('seating_chart_id', selectedLayoutId)
        .order('sort_order', { ascending: true });

      if (groupsError) {
        console.error('Error fetching seating groups:', groupsError);
        return;
      }

      if (groupsData) {
        setGroups(groupsData);
        
        // Initialize positions for groups from database or default
        setGroupPositions(prev => {
          const newPositions = new Map(prev);
          groupsData.forEach((group, index) => {
            // Use saved position from database if available, otherwise default
            if (group.position_x !== undefined && group.position_y !== undefined) {
              newPositions.set(group.id, { 
                x: group.position_x, 
                y: group.position_y 
              });
            } else if (!newPositions.has(group.id)) {
              // Default position: staggered horizontally, spaced vertically
              newPositions.set(group.id, { x: 20 + (index * 20), y: 20 + (index * 100) });
            }
          });
          return newPositions;
        });
        
        // Fetch student seat assignments for all groups
        const groupIds = groupsData.map(g => g.id);
        if (groupIds.length > 0) {
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('student_seat_assignments')
            .select('*, students(*)')
            .in('seating_group_id', groupIds)
            .order('seating_group_id', { ascending: true })
            .order('seat_index', { ascending: true });

          if (assignmentsError) {
            console.error('Error fetching student seat assignments:', assignmentsError);
            // Continue with empty assignments
          }

          // Fixed-slot: store per-group list of { student, seat_index } (matches editor, preserves holes)
          const newGroupAssignments = new Map<string, GroupAssignment[]>();
          groupsData.forEach(group => {
            newGroupAssignments.set(group.id, []);
          });

          if (assignmentsData) {
            const byGroup = new Map<string, StudentSeatAssignment[]>();
            for (const a of assignmentsData as StudentSeatAssignment[]) {
              const gid = a.seating_group_id;
              if (!byGroup.has(gid)) byGroup.set(gid, []);
              byGroup.get(gid)!.push(a);
            }
            byGroup.forEach((assignments, groupId) => {
              const withStudent = assignments.filter((a): a is StudentSeatAssignment & { students: Student } =>
                a.students != null
              );
              const hasNull = withStudent.some(a => a.seat_index == null);
              const sorted = [...withStudent].sort((a, b) => {
                if (hasNull) {
                  const cmp = (a.students.first_name ?? '').localeCompare(b.students.first_name ?? '');
                  return cmp !== 0 ? cmp : (a.students.last_name ?? '').localeCompare(b.students.last_name ?? '');
                }
                const sa = a.seat_index ?? Infinity;
                const sb = b.seat_index ?? Infinity;
                if (sa !== sb) return sa - sb;
                return (a.students.first_name ?? '').localeCompare(b.students.first_name ?? '');
              });
              newGroupAssignments.set(
                groupId,
                sorted.map((a, i) => ({ student: a.students, seat_index: a.seat_index ?? i + 1 }))
              );
            });
          }

          setGroupAssignments(newGroupAssignments);
        } else {
          setGroupAssignments(new Map());
        }
      } else {
        setGroups([]);
        setGroupAssignments(new Map());
      }
    } catch (err) {
      console.error('Unexpected error fetching seating groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [selectedLayoutId]);

  // Fetch groups when layout is selected or when shared roster becomes available
  useEffect(() => {
    if (selectedLayoutId && students.length > 0) {
      fetchGroups();
    } else if (!selectedLayoutId) {
      setGroups([]);
      setGroupAssignments(new Map());
    }
  }, [selectedLayoutId, fetchGroups, students.length]);

  // After leaving the editor, Supabase has the latest assignments — refetch so the view is not stale.
  useEffect(() => {
    const handleSeatingEditMode = (event: Event) => {
      const detail = (event as CustomEvent<{ isEditMode?: boolean }>).detail;
      if (detail?.isEditMode === false) {
        void fetchGroups();
      }
    };

    window.addEventListener('seatingChartEditMode', handleSeatingEditMode as EventListener);
    return () => {
      window.removeEventListener('seatingChartEditMode', handleSeatingEditMode as EventListener);
    };
  }, [fetchGroups]);

  const studentAtSlot = useCallback((groupId: string, seatIndex: number): Student | null => {
    const list = groupAssignments.get(groupId) ?? [];
    const found = list.find(a => a.seat_index === seatIndex);
    return found ? found.student : null;
  }, [groupAssignments]);

  // Apply current layout settings directly from layouts already in state.
  useEffect(() => {
    if (!selectedLayoutId) return;
    const currentLayout = layouts.find((l) => l.id === selectedLayoutId);
    if (currentLayout) {
      applyLayoutViewSettings(currentLayout);
    }
  }, [selectedLayoutId, layouts, applyLayoutViewSettings]);

  // Keep view settings in sync without aggressive polling:
  // 1) local custom events, 2) realtime row updates, 3) low-frequency visible-tab fallback.
  useEffect(() => {
    if (!selectedLayoutId) return;

    const supabase = createClient();

    const handleViewSettingsUpdate = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data, error } = await supabase
          .from('seating_charts')
          .select('show_grid, show_objects, layout_orientation')
          .eq('id', selectedLayoutId)
          .single();

        if (error || !data) return;
        applyLayoutViewSettings(data);
      } catch {
        // Silently fail
      }
    };

    const handleLocalSettingsEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        layoutId?: string;
        show_grid?: boolean | null;
        show_objects?: boolean | null;
        layout_orientation?: string | null;
      }>;
      const detail = customEvent.detail;
      if (!detail || detail.layoutId !== selectedLayoutId) return;
      applyLayoutViewSettings(detail);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void handleViewSettingsUpdate();
      }
    };

    window.addEventListener('seatingChartViewSettingsChanged', handleLocalSettingsEvent as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const realtimeChannel = supabase
      .channel(`seating_chart_view_settings_${selectedLayoutId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seating_charts',
          filter: `id=eq.${selectedLayoutId}`,
        },
        (payload) => {
          const nextRow = payload.new as {
            show_grid?: boolean | null;
            show_objects?: boolean | null;
            layout_orientation?: string | null;
          };
          applyLayoutViewSettings(nextRow);
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('seatingChartViewSettingsChanged', handleLocalSettingsEvent as EventListener);
      void supabase.removeChannel(realtimeChannel);
    };
  }, [selectedLayoutId, applyLayoutViewSettings]);

  // Handle delete layout
  const handleDeleteLayout = (layoutId: string, layoutName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent button click from selecting the layout
    setLayoutToDelete({ id: layoutId, name: layoutName });
    setIsDeleteModalOpen(true);
  };

  // Handle edit layout name
  const handleEditLayout = (layoutId: string, layoutName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLayoutToEdit({ id: layoutId, name: layoutName });
    setIsEditLayoutModalOpen(true);
  };

  const handleEditLayoutSave = async (newName: string) => {
    if (!layoutToEdit) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('seating_charts')
      .update({ name: newName })
      .eq('id', layoutToEdit.id);
    if (error) {
      console.error('Error updating layout name:', error);
      throw new Error('Failed to update layout name.');
    }
    await fetchLayouts();
    setLayoutToEdit(null);
    setIsEditLayoutModalOpen(false);
  };

  const handleOpenSeatingEditor = () => {
    const storageKey = `seatingChart_selectedLayout_${classId}`;
    const layoutId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
    window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: true } }));
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', 'edit');
    if (layoutId) params.set('layout', layoutId);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : `${pathname}?mode=edit`);
  };

  const handleDeleteConfirmed = async () => {
    if (!layoutToDelete) return;

    try {
      const supabase = createClient();
      
      // First, get all groups for this layout
      const { data: groupsData, error: groupsError } = await supabase
        .from('seating_groups')
        .select('id')
        .eq('seating_chart_id', layoutToDelete.id);

      if (groupsError) {
        console.error('Error fetching groups for deletion:', groupsError);
        alert('Failed to delete layout. Please try again.');
        setIsDeleteModalOpen(false);
        setLayoutToDelete(null);
        return;
      }

      // Delete all student seat assignments for all groups in this layout
      if (groupsData && groupsData.length > 0) {
        const groupIds = groupsData.map(g => g.id);
        for (const groupId of groupIds) {
          await supabase
            .from('student_seat_assignments')
            .delete()
            .eq('seating_group_id', groupId);
        }

        // Delete all groups
        for (const groupId of groupIds) {
          await supabase
            .from('seating_groups')
            .delete()
            .eq('id', groupId);
        }
      }

      // Finally, delete the seating chart itself
      const { error: deleteError } = await supabase
        .from('seating_charts')
        .delete()
        .eq('id', layoutToDelete.id);

      if (deleteError) {
        console.error('Error deleting seating chart:', deleteError);
        alert('Failed to delete layout. Please try again.');
        setIsDeleteModalOpen(false);
        setLayoutToDelete(null);
        return;
      }

      // If the deleted layout was selected, clear the selection
      if (selectedLayoutId === layoutToDelete.id) {
        setSelectedLayoutId(null);
        // Clear from localStorage
        const storageKey = `seatingChart_selectedLayout_${classId}`;
        localStorage.removeItem(storageKey);
      }

      // Refresh layouts
      await fetchLayouts();
      
      setIsDeleteModalOpen(false);
      setLayoutToDelete(null);
    } catch (err) {
      console.error('Unexpected error deleting layout:', err);
      alert('An unexpected error occurred. Please try again.');
      setIsDeleteModalOpen(false);
      setLayoutToDelete(null);
    }
  };

  // Handle group click to open award points modal (header only)
  const handleGroupClick = (groupId: string) => {
    const studentsInGroup = (groupAssignments.get(groupId) ?? []).map(a => a.student);
    if (studentsInGroup.length === 0) {
      alert('This group has no students to award points to.');
      return;
    }
    const studentIds = studentsInGroup.map(student => student.id);
    setSelectedGroupStudentIds(studentIds);
    setIsAwardPointsModalOpen(true);
  };

  // Handle single student click to open award points modal for that student only
  const handleStudentClick = (student: Student) => {
    setSelectedGroupStudentIds([student.id]);
    setIsAwardPointsModalOpen(true);
  };

  // Handle points awarded callback
  const handlePointsAwarded = (info: {
    studentAvatar: string;
    studentFirstName: string;
    points: number;
    categoryName: string;
    categoryIcon?: string;
  }) => {
    const fromRef = pendingAwardStudentIdsRef.current;
    pendingAwardStudentIdsRef.current = null;
    const targetIds =
      fromRef && fromRef.length > 0 ? fromRef : [...selectedGroupStudentIds];
    if (targetIds.length > 0 && typeof info.points === 'number') {
      applyOptimisticPointsDelta(targetIds, info.points);
    }
    setAwardInfo(info);
    setIsConfirmationModalOpen(true);
  };

  // Handle create layout
  const handleCreateLayout = async (layoutName: string) => {
    try {
      const supabase = createClient();
      
      const { data, error: insertError } = await supabase
        .from('seating_charts')
        .insert({
          name: layoutName,
          class_id: classId,
          show_grid: true,
          show_objects: true,
          layout_orientation: 'Left',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating seating chart:', insertError);
        alert('Failed to create layout. Please try again.');
        return;
      }

      if (data) {
        // Store the new layout ID in localStorage
        const storageKey = `seatingChart_selectedLayout_${classId}`;
        localStorage.setItem(storageKey, data.id);
        
        // Refresh layouts
        await fetchLayouts();
        setSelectedLayoutId(data.id);
        setIsCreateModalOpen(false);
        
        // Navigate to edit mode with the new layout ID
        window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: true } }));
        const params = new URLSearchParams();
        params.set('view', 'seating'); // Required to show seating chart view
        params.set('mode', 'edit'); // Required to show editor
        params.set('layout', data.id); // Pass the new layout ID
        const newUrl = `${pathname}?${params.toString()}`;
        router.push(newUrl);
      }
    } catch (err) {
      console.error('Unexpected error creating seating chart:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white text-xl">Loading seating charts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white text-xl">{error}</p>
        <button
          onClick={fetchLayouts}
          className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (layouts.length === 0) {
    return (
      <div className="font-spartan w-full min-h-full bg-[#4A3B8D] relative">
        <CanvasToolbar
          className="!z-50"
          style={{
            position: 'fixed',
            right: 8,
            top: toolbarInset.top,
            bottom: toolbarInset.bottom,
            zIndex: 50,
          }}
          topActions={[
            {
              id: 'add',
              title: 'Create new layout',
              onClick: () => setIsCreateModalOpen(true),
              icon: <IconAddPlus className="w-6 h-6 text-black" />,
            },
            {
              id: 'edit',
              title: 'Seating Editor (create a layout first)',
              disabled: true,
              icon: <IconEditPencil className="w-6 h-6 text-gray-500" strokeWidth={2} />,
            },
          ]}
          bottomActions={[
            {
              id: 'teacher-view',
              title: isTeacherView ? "Teacher's view (click to exit)" : "Teacher's view",
              active: isTeacherView,
              onClick: () =>
                setIsTeacherView((v) => {
                  const next = !v;
                  if (classId) localStorage.setItem(`seatingChart_teacherView_${classId}`, String(next));
                  return next;
                }),
              icon: (
                <IconPresentationBoard
                  className={`w-6 h-6 ${isTeacherView ? 'text-black' : 'text-gray-500'}`}
                  strokeWidth={2}
                />
              ),
            },
            {
              id: 'point-log',
              title: isPointLogOpen ? 'Close point log' : 'Open point log',
              active: isPointLogOpen,
              onClick: () => setIsPointLogOpen((v) => !v),
              icon: <IconDocumentClock className="w-6 h-6 text-black" strokeWidth={2} />,
            },
          ]}
        />

        <ClassPointLogSlidePanel
          isOpen={isPointLogOpen}
          position="fixed"
          rightPx={72}
          topPx={toolbarInset.top}
          bottomPx={toolbarInset.bottom}
          zIndex={40}
          logTotalCount={logTotalCount}
          pointLogError={pointLogError}
          isPointLogLoading={isPointLogLoading}
          pagedRows={pagedPointLogRows}
          safeLogPage={safeLogPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          setLogPage={setLogPage}
          setRowsPerPage={setRowsPerPage}
        />

        <div className="p-6 sm:p-8 md:p-10">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <h2 className="text-white text-2xl font-semibold mb-2">No seating charts yet</h2>
              <p className="text-white/80 text-lg">
                Click the + button (top right) to create a new layout, or the pencil to open the Seating Editor after you have one.
              </p>
            </div>
          </div>
        </div>

        <CreateLayoutModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateLayout={handleCreateLayout}
        />
      </div>
    );
  }

  return (
    <div className="font-spartan w-full min-h-full bg-[#4A3B8D] relative">
      {/* Canvas - fixed position, same size as AppViewSeatingChartEditor (no top nav) */}
      <div
        className="bg-[#fcf1f0] fixed border-2 border-black rounded-lg pt-2 overflow-hidden"
        style={{
          top: '6px',
          left: '320px',
          right: '8px',
          bottom: '85px',
          zIndex: 1,
        }}
      >
          {/* Rotatable canvas content: grid, objects, loading/groups (menu bar stays outside) */}
          <div
            className="absolute inset-0"
            style={{
              transform: isTeacherView ? 'rotate(180deg)' : undefined,
              transformOrigin: 'center center',
            }}
          >
            {/* Grid Lines Overlay - Visual guide only (only show if show_grid is true) */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px),
                    linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)
                  `,
                  backgroundSize: '38px 38px', // 1cm ≈ 38px at 96 DPI
                  zIndex: 0
                }}
              />
            )}
            {/* Visual Objects - Whiteboard and TV, Teacher's Desk */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              {/* Whiteboard and TV - Centered at top (always visible) */}
              <div
                className="absolute bg-gray-700 border-2 border-gray-800 rounded-lg flex items-center justify-center"
                style={{
                  top: '0px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '800px',
                  height: '30px',
                  zIndex: 0
                }}
              >
                <span className="text-white font-semibold text-lg" style={isTeacherView ? { display: 'inline-block', transform: 'rotate(-180deg)' } : undefined}>
                  Whiteboard and TV
                </span>
              </div>
              
              {/* Furniture (Teacher's Desk) - Only show if showObjects is true */}
              {showObjects && (
                <>
                  {/* Teacher's Desk - Position based on layoutOrientation */}
                  <div
                    className="absolute bg-gray-700 border-2 border-gray-800 rounded-lg flex items-center justify-center"
                    style={{
                      top: '55px',
                      ...(layoutOrientation === 'Left' 
                        ? { left: '75px' }
                        : { right: '75px' }
                      ),
                      width: '200px',
                      height: '75px',
                      zIndex: 0
                    }}
                  >
                    <span className="text-white font-semibold" style={isTeacherView ? { display: 'inline-block', transform: 'rotate(-180deg)' } : undefined}>
                      Teacher's Desk
                    </span>
                  </div>
                </>
              )}
            </div>
            {isLoadingGroups ? (
              <div className="flex items-center justify-center p-8 relative" style={{ zIndex: 1 }}>
                <p className="text-white/80" style={isTeacherView ? { display: 'inline-block', transform: 'rotate(-180deg)' } : undefined}>
                  Loading groups...
                </p>
              </div>
            ) : groups.length > 0 ? (
              <div
                ref={canvasContainerRef}
                className="relative"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
              >
                    {groups.map((group, index) => {
                      const assignmentsInGroup = groupAssignments.get(group.id) ?? [];
                      const validColumns = Math.max(1, Math.min(3, group.group_columns || 2));
                      const position = groupPositions.get(group.id) || { x: 20 + (index * 20), y: 20 + (index * 100) };
                      const groupX = position.x;
                      const groupY = position.y;
                      const maxIndex = assignmentsInGroup.length === 0 ? 0 : Math.max(...assignmentsInGroup.map(a => a.seat_index));
                      const numRows = Math.max(1, Math.ceil(maxIndex / validColumns));
                      const headerHeight = 50;
                      const studentRowHeight = 50;
                      const padding = 8;
                      const gap = 8;
                      const baseWidthFor2Columns = 400;
                      const cardMinWidth = 180;
                      const cardWidthFor2Columns = Math.max(cardMinWidth, (baseWidthFor2Columns - (padding * 2) - (gap * (2 - 1))) / 2);
                      const twoColumnGroupWidth = Math.max(300, (cardWidthFor2Columns * 2) + (gap * (2 - 1)) + (padding * 2));
                      let groupWidth: number;
                      if (validColumns === 1) {
                        groupWidth = twoColumnGroupWidth * 0.5;
                      } else if (validColumns === 2) {
                        groupWidth = twoColumnGroupWidth;
                      } else {
                        const cardWidth = Math.max(cardMinWidth, (baseWidthFor2Columns - (padding * 2) - (gap * (validColumns - 1))) / validColumns);
                        groupWidth = Math.max(300, (cardWidth * validColumns) + (gap * (validColumns - 1)) + (padding * 2));
                      }
                      const groupHeight = headerHeight + (numRows * studentRowHeight) + (padding * 2);

                      const studentCardHeight = 32;
                      const studentPointsWidth = 36;

                      const renderStudentCard = (student: Student) => {
                        // In multi-select mode: yellow when selected, otherwise gender-based
                        const isSelected = isMultiSelectMode && selectedStudentIds.includes(student.id);
                        let bgColor: string;
                        if (isSelected) {
                          bgColor = 'bg-yellow-200 border-yellow-400';
                        } else if (student.gender === null || student.gender === undefined || student.gender === '') {
                          bgColor = 'bg-white border-gray-200';
                        } else if (student.gender === 'Boy') {
                          bgColor = 'bg-blue-200 border-blue-300';
                        } else if (student.gender === 'Girl') {
                          bgColor = 'bg-pink-200 border-pink-300';
                        } else {
                          bgColor = 'bg-white border-gray-200';
                        }
                        
                        return (
                          <div
                            key={student.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMultiSelectMode && onSelectStudent) {
                                onSelectStudent(student.id);
                              } else {
                                handleStudentClick(student);
                              }
                            }}
                            className={`flex items-center gap-1 p-1.5 rounded border cursor-pointer hover:opacity-90 transition-opacity min-w-0 overflow-hidden ${bgColor}`}
                            style={{
                              width: '100%',
                              height: `${studentCardHeight}px`
                            }}
                          >
                            <div className="flex-1 min-w-0 flex items-center gap-2 pr-1" style={isTeacherView ? { display: 'inline-flex', width: '100%', transform: 'rotate(-180deg)' } : undefined}>
                              <p 
                                className="font-medium text-gray-800 overflow-hidden whitespace-nowrap flex-1 min-w-0 pr-1"
                                style={{
                                  fontSize: 'clamp(0.8rem, 110%, 1.25rem)',
                                  lineHeight: '1.2'
                                }}
                              >
                                {student.first_name}
                              </p>
                              <span className="text-red-600 font-semibold flex-shrink-0 text-right tabular-nums" style={{
                                width: `${studentPointsWidth}px`,
                                fontSize: 'clamp(0.875rem, 120%, 1.5rem)', // Fixed font size for all groups (same as 1-column groups)
                                lineHeight: '1.2'
                              }}>
                                {student.points || 0}
                              </span>
                            </div>
                          </div>
                        );
                      };
                      
                      return (
                        <div
                          key={group.id}
                          className="bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col transition-shadow"
                          style={{
                            position: 'absolute',
                            left: `${groupX}px`,
                            top: `${groupY}px`,
                            width: `${groupWidth}px`,
                            height: `${groupHeight}px`,
                            zIndex: 1,
                            boxSizing: 'border-box',
                            gap: 0,
                            overflow: 'hidden',
                            pointerEvents: 'auto'
                          }}
                        >
                          {/* Group Header - Row 1 (clickable: award points to whole group, only when not in multi-select) */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMultiSelectMode) {
                                handleGroupClick(group.id);
                              }
                            }}
                            className={`border-b border-gray-200 bg-purple-50 rounded-t-lg transition-colors ${!isMultiSelectMode ? 'cursor-pointer hover:bg-purple-100' : ''}`}
                            style={{
                              height: '50px',
                              minHeight: '50px',
                              maxHeight: '50px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 0.5rem',
                              boxSizing: 'border-box'
                            }}
                          >
                            {/* Team Name */}
                            <div className="flex-1" style={isTeacherView ? { display: 'inline-block', transform: 'rotate(-180deg)' } : undefined}>
                              <h4 className="font-semibold text-gray-800">{group.name}</h4>
                            </div>
                          </div>
                          
                          {/* Fixed-slot grid (matches editor): empty slots shown as placeholders */}
                          {Array.from({ length: numRows }, (_, rowIndex) => (
                            <div
                              key={`${group.id}-row-${rowIndex}`}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${validColumns}, 1fr)`,
                                gap: '0.5rem',
                                padding: '0 0.5rem',
                                backgroundColor: '#f9fafb',
                                height: '50px',
                                minHeight: '50px',
                                maxHeight: '50px',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                                alignItems: 'center'
                              }}
                            >
                              {Array.from({ length: validColumns }, (_, colIndex) => {
                                // Teacher view: canvas is rotated 180°, so DOM (row 0, col 0) appears bottom-right = seat 1; use same formula
                                const slotIndex = rowIndex * validColumns + colIndex + 1;
                                const student = studentAtSlot(group.id, slotIndex);
                                if (student) {
                                  return <div key={slotIndex} className="w-full min-w-0">{renderStudentCard(student)}</div>;
                                }
                                return (
                                  <div
                                    key={slotIndex}
                                    className="rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-xs bg-gray-50/50"
                                    style={{ height: `${studentCardHeight}px` }}
                                  >
                                    <span style={isTeacherView ? { display: 'inline-block', transform: 'rotate(-180deg)' } : undefined}>Empty</span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      );
                    })}
              </div>
            ) : null}
          </div>
          <CanvasToolbar
            className="absolute right-2 top-2 bottom-2 z-10"
            topActions={[
              {
                id: 'add',
                title: 'Create new layout',
                onClick: () => setIsCreateModalOpen(true),
                icon: <IconAddPlus className="w-6 h-6 text-black" />,
              },
              {
                id: 'edit',
                title: 'Seating Editor View',
                onClick: handleOpenSeatingEditor,
                icon: <IconEditPencil className="w-6 h-6 text-black" strokeWidth={2} />,
              },
            ]}
            bottomActions={[
              {
                id: 'teacher-view',
                title: isTeacherView ? "Teacher's view (click to exit)" : "Teacher's view",
                active: isTeacherView,
                onClick: () =>
                  setIsTeacherView((v) => {
                    const next = !v;
                    if (classId) localStorage.setItem(`seatingChart_teacherView_${classId}`, String(next));
                    return next;
                  }),
                icon: (
                  <IconPresentationBoard
                    className={`w-6 h-6 ${isTeacherView ? 'text-black' : 'text-gray-500'}`}
                    strokeWidth={2}
                  />
                ),
              },
              {
                id: 'point-log',
                title: isPointLogOpen ? 'Close point log' : 'Open point log',
                active: isPointLogOpen,
                onClick: () => setIsPointLogOpen((v) => !v),
                icon: <IconDocumentClock className="w-6 h-6 text-black" strokeWidth={2} />,
              },
            ]}
          />

          <ClassPointLogSlidePanel
            isOpen={isPointLogOpen}
            position="absolute"
            rightPx={72}
            topPx={8}
            bottomPx={8}
            logTotalCount={logTotalCount}
            pointLogError={pointLogError}
            isPointLogLoading={isPointLogLoading}
            pagedRows={pagedPointLogRows}
            safeLogPage={safeLogPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setLogPage={setLogPage}
            setRowsPerPage={setRowsPerPage}
          />
      </div>

      {/* Delete Layout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setLayoutToDelete(null);
        }}
        onConfirm={handleDeleteConfirmed}
        title="Delete Layout"
        message={`Are you sure you want to delete "${layoutToDelete?.name}"? This action cannot be undone and will permanently delete the layout, all groups, and student seat assignments.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        icon={
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        }
      />

      {/* Create Layout Modal */}
      <CreateLayoutModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLayout={handleCreateLayout}
      />

      {/* Edit Layout Name Modal */}
      <EditLayoutModal
        isOpen={isEditLayoutModalOpen && layoutToEdit !== null}
        onClose={() => {
          setIsEditLayoutModalOpen(false);
          setLayoutToEdit(null);
        }}
        currentName={layoutToEdit?.name ?? ''}
        onSave={handleEditLayoutSave}
      />

      {/* Award Points Modal for Group or Single Student */}
      {selectedGroupStudentIds.length > 0 && (
        <AwardPointsModal
          isOpen={isAwardPointsModalOpen}
          onClose={() => {
            setIsAwardPointsModalOpen(false);
            setSelectedGroupStudentIds([]);
          }}
          student={selectedGroupStudentIds.length === 1 ? (students.find(s => s.id === selectedGroupStudentIds[0]) ?? null) : null}
          classId={classId}
          selectedStudentIds={selectedGroupStudentIds}
          onAwardComplete={(selectedIds) => {
            pendingAwardStudentIdsRef.current = selectedIds;
            setIsAwardPointsModalOpen(false);
            setSelectedGroupStudentIds([]);
          }}
          onPointsAwarded={handlePointsAwarded}
        />
      )}

      {/* Points Awarded Confirmation Modal */}
      {awardInfo && (
        <PointsAwardedConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => {
            setIsConfirmationModalOpen(false);
            setAwardInfo(null);
          }}
          studentAvatar={awardInfo.studentAvatar}
          studentFirstName={awardInfo.studentFirstName}
          points={awardInfo.points}
          categoryName={awardInfo.categoryName}
          categoryIcon={awardInfo.categoryIcon}
        />
      )}
    </div>
  );
}
