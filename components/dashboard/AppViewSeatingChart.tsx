'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
type PointLogRow = {
  id: string;
  studentName: string;
  reason: string;
  points: number;
  createdAt: string;
};

interface AppViewSeatingChartProps {
  classId: string;
  isMultiSelectMode?: boolean;
  selectedStudentIds?: string[];
  onSelectStudent?: (studentId: string) => void;
}

export default function AppViewSeatingChart({ classId, isMultiSelectMode = false, selectedStudentIds = [], onSelectStudent }: AppViewSeatingChartProps) {
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [groupPositions, setGroupPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const setSeatingLayoutData = useSeatingLayoutNav();
  const [layoutToDelete, setLayoutToDelete] = useState<{ id: string; name: string } | null>(null);
  const [layoutToEdit, setLayoutToEdit] = useState<{ id: string; name: string } | null>(null);
  const [isEditLayoutModalOpen, setIsEditLayoutModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAwardPointsModalOpen, setIsAwardPointsModalOpen] = useState(false);
  const [selectedGroupStudentIds, setSelectedGroupStudentIds] = useState<string[]>([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [awardInfo, setAwardInfo] = useState<{
    studentAvatar: string;
    studentFirstName: string;
    points: number;
    categoryName: string;
    categoryIcon?: string;
  } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvasLeft, setCanvasLeft] = useState(320); // Same as editor: sidebar right edge + 8px
  // View settings from database
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showObjects, setShowObjects] = useState<boolean>(true);
  const [layoutOrientation, setLayoutOrientation] = useState<string>('Left');
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [isPointLogOpen, setIsPointLogOpen] = useState(false);
  const [isPointLogLoading, setIsPointLogLoading] = useState(false);
  const [pointLogError, setPointLogError] = useState<string | null>(null);
  const [pointLogRows, setPointLogRows] = useState<PointLogRow[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [logTotalCount, setLogTotalCount] = useState(0);
  const skipNextTeacherViewPersistRef = useRef(true);

  // Persist teacher-view preference per class so it survives temporary remounts.
  useEffect(() => {
    if (!classId) return;
    skipNextTeacherViewPersistRef.current = true;
    const storageKey = `seatingChart_teacherView_${classId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setIsTeacherView(stored === 'true');
    }
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    if (skipNextTeacherViewPersistRef.current) {
      skipNextTeacherViewPersistRef.current = false;
      return;
    }
    const storageKey = `seatingChart_teacherView_${classId}`;
    localStorage.setItem(storageKey, String(isTeacherView));
  }, [classId, isTeacherView]);

  const formatDateDDMMYYYY = useCallback((isoDate: string) => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  }, []);

  const fetchPointLogRows = useCallback(async () => {
    if (!classId) return;
    try {
      setIsPointLogLoading(true);
      setPointLogError(null);
      const supabase = createClient();

      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('class_id', classId);

      if (studentsError) {
        console.error('Error fetching students for point log:', studentsError);
        setPointLogError('Failed to load point log students.');
        setPointLogRows([]);
        setLogTotalCount(0);
        return;
      }

      const studentNameMap = new Map<string, string>();
      const studentIds = (classStudents ?? []).map((s: any) => {
        const first = s.first_name ?? '';
        const last = s.last_name ?? '';
        studentNameMap.set(s.id, `${first} ${last}`.trim() || 'Unknown student');
        return s.id;
      });

      if (studentIds.length === 0) {
        setPointLogRows([]);
        setLogTotalCount(0);
        return;
      }

      const { data: pointEvents, error: pointEventsError } = await supabase
        .from('point_events')
        .select('id, student_id, category_id, points, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      const { data: customEvents, error: customEventsError } = await supabase
        .from('custom_point_events')
        .select('id, student_id, points, memo, created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (pointEventsError) {
        console.error('Error fetching point events:', pointEventsError);
      }
      if (customEventsError) {
        console.error('Error fetching custom point events:', customEventsError);
      }

      const categoryIds = Array.from(
        new Set(
          ((pointEvents ?? []) as any[])
            .map((ev) => ev.category_id)
            .filter(Boolean)
        )
      );

      const categoryMap = new Map<string, string>();
      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('point_categories')
          .select('id, name')
          .in('id', categoryIds);
        if (categoriesError) {
          console.error('Error fetching point categories for log:', categoriesError);
        } else {
          (categoriesData ?? []).forEach((c: any) => {
            categoryMap.set(c.id, c.name ?? 'Category');
          });
        }
      }

      const standardRows: PointLogRow[] = ((pointEvents ?? []) as any[]).map((ev) => {
        const categoryId = ev.category_id;
        return {
          id: `standard-${ev.id}`,
          studentName: studentNameMap.get(ev.student_id) ?? 'Unknown student',
          reason: categoryMap.get(categoryId) ?? 'Point award',
          points: Number(ev.points ?? 0),
          createdAt: ev.created_at,
        };
      });

      const customRows: PointLogRow[] = ((customEvents ?? []) as any[]).map((ev) => {
        const memo = String(ev.memo ?? '').trim();
        return {
          id: `custom-${ev.id}`,
          studentName: studentNameMap.get(ev.student_id) ?? 'Unknown student',
          reason: memo ? `Custom: ${memo}` : 'Custom',
          points: Number(ev.points ?? 0),
          createdAt: ev.created_at,
        };
      });

      const mergedRows = [...standardRows, ...customRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPointLogRows(mergedRows);
      setLogTotalCount(mergedRows.length);
    } catch (err) {
      console.error('Unexpected error fetching point log rows:', err);
      setPointLogError('Failed to load point log.');
      setPointLogRows([]);
      setLogTotalCount(0);
    } finally {
      setIsPointLogLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (isPointLogOpen) {
      setLogPage(1);
      fetchPointLogRows();
    }
  }, [isPointLogOpen, fetchPointLogRows]);

  useEffect(() => {
    setLogPage(1);
  }, [rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(logTotalCount / rowsPerPage));
  const safeLogPage = Math.min(Math.max(logPage, 1), totalPages);
  const pagedPointLogRows = useMemo(() => {
    const start = (safeLogPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return pointLogRows.slice(start, end);
  }, [pointLogRows, rowsPerPage, safeLogPage]);

  // Match editor canvas position: compute left from layout sidebar (data-sidebar-container)
  useEffect(() => {
    const updateCanvasLeft = () => {
      const sidebar = document.querySelector('[data-sidebar-container]');
      if (sidebar) {
        const rect = sidebar.getBoundingClientRect();
        setCanvasLeft(rect.right + 8);
      } else {
        setCanvasLeft(320);
      }
    };
    const timeoutId = setTimeout(updateCanvasLeft, 10);
    updateCanvasLeft();
    window.addEventListener('resize', updateCanvasLeft);
    const interval = setInterval(updateCanvasLeft, 100);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasLeft);
      clearInterval(interval);
    };
  }, []);

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

  // Fetch all students for the class
  const fetchAllStudents = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('student_number', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }

      if (data) {
        setAllStudents(data as Student[]);
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err);
    }
  }, [classId]);

  // Fetch all students on mount
  useEffect(() => {
    if (classId) {
      fetchAllStudents();
    }
  }, [classId, fetchAllStudents]);

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
  }, [selectedLayoutId, allStudents]);

  // Fetch groups when layout is selected or when allStudents changes
  useEffect(() => {
    if (selectedLayoutId && allStudents.length > 0) {
      fetchGroups();
    } else if (!selectedLayoutId) {
      setGroups([]);
      setGroupAssignments(new Map());
    }
  }, [selectedLayoutId, fetchGroups, allStudents.length]);

  const studentAtSlot = useCallback((groupId: string, seatIndex: number): Student | null => {
    const list = groupAssignments.get(groupId) ?? [];
    const found = list.find(a => a.seat_index === seatIndex);
    return found ? found.student : null;
  }, [groupAssignments]);

  // Fetch layout settings (show_grid, show_objects, layout_orientation) when layout changes
  useEffect(() => {
    const fetchLayoutSettings = async () => {
      if (!selectedLayoutId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('seating_charts')
          .select('show_grid, show_objects, layout_orientation')
          .eq('id', selectedLayoutId)
          .single();

        if (error) {
          console.error('Error fetching layout settings:', error);
          return;
        }

        if (data) {
          // Set value from database (default to true if null, 'Left' if null)
          setShowGrid(data.show_grid ?? true);
          setShowObjects(data.show_objects ?? true);
          setLayoutOrientation(data.layout_orientation ?? 'Left');
        }
      } catch (err) {
        console.error('Unexpected error fetching layout settings:', err);
      }
    };

    fetchLayoutSettings();
  }, [selectedLayoutId]);

  // Listen for view settings updates (polling approach)
  useEffect(() => {
    if (!selectedLayoutId) return;
    
    const handleViewSettingsUpdate = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('seating_charts')
          .select('show_grid, show_objects, layout_orientation')
          .eq('id', selectedLayoutId)
          .single();

        if (error) {
          return; // Silently fail if error
        }

        if (data) {
          setShowGrid(data.show_grid ?? true);
          setShowObjects(data.show_objects ?? true);
          setLayoutOrientation(data.layout_orientation ?? 'Left');
        }
      } catch (err) {
        // Silently fail
      }
    };

    // Poll for changes every 500ms to catch updates from bottom nav
    const interval = setInterval(handleViewSettingsUpdate, 500);
    
    return () => clearInterval(interval);
  }, [selectedLayoutId]);

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
    setAwardInfo(info);
    setIsConfirmationModalOpen(true);
    // Refresh students and groups to update points display
    fetchAllStudents();
    if (selectedLayoutId) {
      fetchGroups();
    }
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
        {/* Vertical menu bar on the right - Create layout (+) and Seating Editor (pencil, disabled) */}
        <div
          className="fixed right-2 top-2 bottom-2 flex flex-col gap-2 p-2 rounded-xl bg-white z-50"
          aria-label="Canvas actions"
        >
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow"
            title="Create new layout"
          >
            <IconAddPlus className="w-6 h-6 text-black" />
          </button>
          <button
            className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow cursor-not-allowed opacity-60"
            title="Seating Editor (create a layout first)"
            disabled
            aria-disabled="true"
          >
            <IconEditPencil className="w-6 h-6 text-gray-500" strokeWidth={2} />
          </button>
          <div className="flex-1 min-h-2" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setIsTeacherView((v) => !v)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow transition-colors ${isTeacherView ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-200 hover:bg-gray-300 opacity-75'}`}
            title={isTeacherView ? "Teacher's view (click to exit)" : "Teacher's view"}
            aria-label={isTeacherView ? "Teacher's view (click to exit)" : "Teacher's view"}
          >
            <IconPresentationBoard className={`w-6 h-6 ${isTeacherView ? 'text-black' : 'text-gray-500'}`} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setIsPointLogOpen((v) => !v)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow transition-colors ${isPointLogOpen ? 'bg-purple-100 hover:bg-purple-200' : 'bg-white/90 hover:bg-white'}`}
            title={isPointLogOpen ? 'Close point log' : 'Open point log'}
            aria-label={isPointLogOpen ? 'Close point log' : 'Open point log'}
          >
            <IconDocumentClock className="w-6 h-6 text-black" strokeWidth={2} />
          </button>
        </div>

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
          left: `${canvasLeft}px`,
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
                      const studentPointsWidth = 42;

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
                                className="font-medium text-gray-800 truncate flex-1 min-w-0 pr-1"
                                style={{
                                  fontSize: 'clamp(0.875rem, 120%, 1.5rem)', // Fixed font size for all groups (same as 1-column groups)
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
          {/* Vertical menu bar on the right - Create layout (+) and Seating Editor (pencil) */}
          <div
            className="absolute right-2 top-2 bottom-2 flex flex-col gap-2 p-2 rounded-xl bg-white/80 z-10 border-2 border-black"
            aria-label="Canvas actions"
          >
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow"
              title="Create new layout"
            >
              <IconAddPlus className="w-6 h-6 text-black" />
            </button>
            <button
              onClick={handleOpenSeatingEditor}
              className="w-10 h-10 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center transition-colors shadow"
              title="Seating Editor View"
            >
              <IconEditPencil className="w-6 h-6 text-black" strokeWidth={2} />
            </button>
            <div className="flex-1 min-h-2" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setIsTeacherView((v) => !v)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center shadow transition-colors ${isTeacherView ? 'bg-purple-100 hover:bg-purple-200' : 'bg-gray-200 hover:bg-gray-300 opacity-75'}`}
              title={isTeacherView ? "Teacher's view (click to exit)" : "Teacher's view"}
              aria-label={isTeacherView ? "Teacher's view (click to exit)" : "Teacher's view"}
            >
              <IconPresentationBoard className={`w-6 h-6 ${isTeacherView ? 'text-black' : 'text-gray-500'}`} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setIsPointLogOpen((v) => !v)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center shadow transition-colors ${isPointLogOpen ? 'bg-purple-100 hover:bg-purple-200' : 'bg-white/90 hover:bg-white'}`}
              title={isPointLogOpen ? 'Close point log' : 'Open point log'}
              aria-label={isPointLogOpen ? 'Close point log' : 'Open point log'}
            >
              <IconDocumentClock className="w-6 h-6 text-black" strokeWidth={2} />
            </button>
          </div>
          {/* Point Log slide-in panel */}
          <div
            className="absolute top-2 bottom-2 z-20 transition-all duration-300 ease-out"
            style={{
              right: '72px',
              width: 'min(720px, calc(100% - 160px))',
              transform: isPointLogOpen ? 'translateX(0)' : 'translateX(110%)',
              opacity: isPointLogOpen ? 1 : 0,
              pointerEvents: isPointLogOpen ? 'auto' : 'none',
            }}
          >
            <div className="h-full rounded-xl border-2 border-black bg-white shadow-lg overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Point Log</h3>
                <span className="text-sm text-gray-500">{logTotalCount} records</span>
              </div>

              {pointLogError && (
                <div className="px-4 py-2 text-sm text-red-600 border-b border-red-100 bg-red-50">
                  {pointLogError}
                </div>
              )}

              <div className="grid grid-cols-[1.3fr_1.6fr_1fr_0.7fr] gap-3 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
                <div>Student</div>
                <div>Point category / reason</div>
                <div>Awarded date</div>
                <div className="text-right">Points</div>
              </div>

              <div className="flex-1 overflow-auto">
                {isPointLogLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-500">Loading point log...</div>
                ) : pagedPointLogRows.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">No point log entries yet.</div>
                ) : (
                  <div>
                    {pagedPointLogRows.map((row, rowIndex) => (
                      <div
                        key={row.id}
                        className={`grid grid-cols-[1.3fr_1.6fr_1fr_0.7fr] gap-3 px-4 py-2 text-sm border-b border-gray-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#fcf1f0]'}`}
                      >
                        <div className="text-gray-900 truncate">{row.studentName}</div>
                        <div className="text-gray-700 truncate">{row.reason}</div>
                        <div className="text-gray-700">{formatDateDDMMYYYY(row.createdAt)}</div>
                        <div className={`text-right font-semibold ${row.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.points > 0 ? `+${row.points}` : row.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  disabled={safeLogPage <= 1}
                  className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
                >
                  &larr;
                </button>
                <span className="text-gray-700">Page {safeLogPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeLogPage >= totalPages}
                  className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
                >
                  &rarr;
                </button>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="ml-auto border border-gray-300 rounded px-2 py-1"
                >
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>
            </div>
          </div>
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
          student={selectedGroupStudentIds.length === 1 ? (allStudents.find(s => s.id === selectedGroupStudentIds[0]) ?? null) : null}
          classId={classId}
          selectedStudentIds={selectedGroupStudentIds}
          onAwardComplete={() => {
            setIsAwardPointsModalOpen(false);
            setSelectedGroupStudentIds([]);
            // Refresh students and groups to update points
            fetchAllStudents();
            if (selectedLayoutId) {
              fetchGroups();
            }
          }}
          onPointsAwarded={handlePointsAwarded}
          onRefresh={() => {
            // Refresh students and groups to update points
            fetchAllStudents();
            if (selectedLayoutId) {
              fetchGroups();
            }
          }}
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
