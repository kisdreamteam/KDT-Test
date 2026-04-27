'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/client';
import { useDashboard } from '@/context/DashboardContext';
import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';
import EditGroupModal from '@/components/modals/EditGroupModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import SuccessNotificationModal from '@/components/modals/SuccessNotificationModal';
import IconSettingsWheel from '@/components/iconsCustom/iconSettingsWheel';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import SeatingCanvasDecor from './seating/SeatingCanvasDecor';

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
  group_columns: number; // Number of columns for the group (renamed from grid_columns)
  group_rows?: number;  // Number of rows for the group (1 header + student rows, min 2)
  position_x?: number; // X position in pixels on the canvas
  position_y?: number; // Y position in pixels on the canvas
  created_at: string;
}

interface StudentSeatAssignment {
  seating_group_id: string;
  seat_index: number | null;
  students: Student | null;
}

/** Per-group assignment with seat_index for fixed-slot grid. */
type GroupAssignment = { student: Student; seat_index: number };

const GROUP_BASE_WIDTH_FOR_2_COLUMNS = 400;
const GROUP_PADDING = 8;
const GROUP_GAP = 8;
const GROUP_CARD_MIN_WIDTH = 180;
const GROUP_MIN_WIDTH = 300;
const GROUP_MIN_HEIGHT = 100;
const GROUP_HEADER_HEIGHT = 50;
const GROUP_STUDENT_ROW_HEIGHT = 50;
const GROUP_EXPAND_ROW_HEIGHT = 36;
const DEFAULT_GROUP_STAGGER_X = 20;
const DEFAULT_GROUP_STAGGER_Y = 100;
const DEFAULT_GROUP_START = 20;
const BATCH_GROUPS_PER_ROW = 3;
const BATCH_GROUP_HEIGHT = 150;
const BATCH_GROUP_HORIZONTAL_SPACING = 30;
const BATCH_GROUP_VERTICAL_SPACING = 30;
const BATCH_GROUP_START_X = 50;
const BATCH_GROUP_START_Y = 50;

function getMaxSeatIndexFromAssignments(assignments: GroupAssignment[]): number {
  if (assignments.length === 0) return 0;
  return Math.max(...assignments.map((a) => a.seat_index ?? 0));
}

function getMaxSeatIndexInColumn(assignments: GroupAssignment[], column: number, columns: number): number {
  const inColumn = assignments.filter((a) => ((a.seat_index ?? 0) - 1) % columns === column);
  return inColumn.length === 0 ? 0 : Math.max(...inColumn.map((a) => a.seat_index ?? 0));
}

function getNextSeatIndex(assignments: GroupAssignment[]): number {
  return getMaxSeatIndexFromAssignments(assignments) + 1;
}

function getNextSeatIndexInColumn(assignments: GroupAssignment[], column: number, columns: number): number {
  const maxInColumn = getMaxSeatIndexInColumn(assignments, column, columns);
  return maxInColumn === 0 ? column + 1 : maxInColumn + columns;
}

function getBatchGroupWidth(): number {
  const cardWidthFor2Columns = Math.max(
    GROUP_CARD_MIN_WIDTH,
    (GROUP_BASE_WIDTH_FOR_2_COLUMNS - GROUP_PADDING * 2 - GROUP_GAP * (2 - 1)) / 2
  );
  return Math.max(GROUP_MIN_WIDTH, cardWidthFor2Columns * 2 + GROUP_GAP * (2 - 1) + GROUP_PADDING * 2);
}

function getBatchGroupPosition(index: number, groupWidth: number): { x: number; y: number } {
  const row = Math.floor(index / BATCH_GROUPS_PER_ROW);
  const col = index % BATCH_GROUPS_PER_ROW;
  return {
    x: BATCH_GROUP_START_X + col * (groupWidth + BATCH_GROUP_HORIZONTAL_SPACING),
    y: BATCH_GROUP_START_Y + row * (BATCH_GROUP_HEIGHT + BATCH_GROUP_VERTICAL_SPACING),
  };
}

function getGroupRenderLayout(groupColumns: number, assignmentsInGroup: GroupAssignment[]) {
  const validColumns = Math.max(1, Math.min(3, groupColumns || 2));
  const maxIndex = getMaxSeatIndexFromAssignments(assignmentsInGroup);
  const numRows = Math.max(1, Math.ceil(maxIndex / validColumns));

  const cardWidthFor2Columns = Math.max(
    GROUP_CARD_MIN_WIDTH,
    (GROUP_BASE_WIDTH_FOR_2_COLUMNS - GROUP_PADDING * 2 - GROUP_GAP * (2 - 1)) / 2
  );
  const twoColumnGroupWidth = Math.max(
    GROUP_MIN_WIDTH,
    cardWidthFor2Columns * 2 + GROUP_GAP * (2 - 1) + GROUP_PADDING * 2
  );

  let groupWidth: number;
  if (validColumns === 1) {
    groupWidth = twoColumnGroupWidth * 0.5;
  } else if (validColumns === 2) {
    groupWidth = twoColumnGroupWidth;
  } else {
    const cardWidth = Math.max(
      GROUP_CARD_MIN_WIDTH,
      (GROUP_BASE_WIDTH_FOR_2_COLUMNS - GROUP_PADDING * 2 - GROUP_GAP * (validColumns - 1)) / validColumns
    );
    groupWidth = Math.max(
      GROUP_MIN_WIDTH,
      cardWidth * validColumns + GROUP_GAP * (validColumns - 1) + GROUP_PADDING * 2
    );
  }

  const groupHeight =
    GROUP_HEADER_HEIGHT +
    numRows * GROUP_STUDENT_ROW_HEIGHT +
    GROUP_EXPAND_ROW_HEIGHT +
    GROUP_PADDING * 2;

  return { validColumns, numRows, groupWidth, groupHeight };
}

function getDefaultStaggerPosition(index: number): { x: number; y: number } {
  return {
    x: DEFAULT_GROUP_START + index * DEFAULT_GROUP_STAGGER_X,
    y: DEFAULT_GROUP_START + index * DEFAULT_GROUP_STAGGER_Y,
  };
}

function getSlotIndex(rowIndex: number, colIndex: number, columns: number): number {
  return rowIndex * columns + colIndex + 1;
}

interface AppViewSeatingChartEditorProps {
  classId: string;
  /** Shared class roster from parent — same source as AppViewSeatingChart. */
  students: Student[];
}

export default function AppViewSeatingChartEditor({ classId, students }: AppViewSeatingChartEditorProps) {
  const { selectedStudentForGroup, setSelectedStudentForGroup, setUnseatedStudents, unseatedStudents } = useSeatingChart();
  const { activeSeatingLayoutId, setActiveSeatingLayoutId } = useDashboard();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SeatingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isClearTeamModalOpen, setIsClearTeamModalOpen] = useState(false);
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [teamToClear, setTeamToClear] = useState<SeatingGroup | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<SeatingGroup | null>(null);
  const [successNotification, setSuccessNotification] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [isSavingAllChanges, setIsSavingAllChanges] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SeatingGroup | null>(null);
  /** Fixed-slot: groupId -> list of { student, seat_index } (may have gaps). */
  const [groupAssignments, setGroupAssignments] = useState<Map<string, GroupAssignment[]>>(new Map());
  const groupAssignmentsRef = useRef<Map<string, GroupAssignment[]>>(new Map());
  const handleCloseRef = useRef<() => void>(() => {});
  const addStudentToGroupInFlightRef = useRef<{ studentId: string; groupId: string } | null>(null);
  const saveAllChangesInFlightRef = useRef(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    groupAssignmentsRef.current = groupAssignments;
  }, [groupAssignments]);

  // Helpers for fixed-slot grid (derived from groupAssignments)
  const getAssignmentsInGroup = useCallback((groupId: string): GroupAssignment[] => {
    return groupAssignments.get(groupId) ?? [];
  }, [groupAssignments]);
  const getStudentsInGroup = useCallback((groupId: string): Student[] => {
    return (groupAssignments.get(groupId) ?? []).map(a => a.student);
  }, [groupAssignments]);
  const studentAtSlot = useCallback((groupId: string, seatIndex: number): Student | null => {
    const list = groupAssignments.get(groupId) ?? [];
    const found = list.find(a => a.seat_index === seatIndex);
    return found ? found.student : null;
  }, [groupAssignments]);
  const maxSeatIndex = useCallback((groupId: string): number => {
    const list = groupAssignments.get(groupId) ?? [];
    return getMaxSeatIndexFromAssignments(list);
  }, [groupAssignments]);
  const maxSeatIndexInColumn = useCallback((groupId: string, col: number, C: number): number => {
    const list = groupAssignments.get(groupId) ?? [];
    return getMaxSeatIndexInColumn(list, col, C);
  }, [groupAssignments]);
  const nextSeatIndexInColumn = useCallback((groupId: string, col: number, C: number): number => {
    const list = groupAssignments.get(groupId) ?? [];
    return getNextSeatIndexInColumn(list, col, C);
  }, [groupAssignments]);
  const [openSettingsMenuId, setOpenSettingsMenuId] = useState<string | null>(null);
  const [settingsMenuPosition, setSettingsMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [selectedStudentForSwap, setSelectedStudentForSwap] = useState<{ studentId: string; groupId: string } | null>(null);
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState<string>('');
  // Store pixel positions for each group (x, y coordinates)
  const [groupPositions, setGroupPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  // Track which group is being dragged
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  // Color coding mode: "Gender" or "Level"
  const [colorCodeBy, setColorCodeBy] = useState<'Gender' | 'Level'>('Gender');
  // View settings from database
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showObjects, setShowObjects] = useState<boolean>(true);
  const [layoutOrientation, setLayoutOrientation] = useState<string>('Left');

  const applyLayoutViewSettings = useCallback((data: {
    show_grid?: boolean | null;
    show_objects?: boolean | null;
    layout_orientation?: string | null;
  }) => {
    setShowGrid(data.show_grid ?? true);
    setShowObjects(data.show_objects ?? true);
    setLayoutOrientation(data.layout_orientation ?? 'Left');
  }, []);
  
  // Helper function to show success notification
  const showSuccessNotification = (title: string, message: string) => {
    setSuccessNotification({ isOpen: true, title, message });
  };

  // Renumber seat_index to 1..N for a group (after remove or column change). Keeps display order.
  const renumberSeatIndicesForGroup = useCallback(async (groupId: string) => {
    const supabase = createClient();
    const { data: assignments, error } = await supabase
      .from('student_seat_assignments')
      .select('id')
      .eq('seating_group_id', groupId)
      .order('seat_index', { ascending: true, nullsFirst: false });
    if (error || !assignments?.length) return;
    for (let i = 0; i < assignments.length; i++) {
      await supabase.from('student_seat_assignments').update({ seat_index: i + 1 }).eq('id', assignments[i].id);
    }
  }, []);

  // Handle close button - navigate back to seating chart view (remove mode=edit)
  const handleClose = () => {
    void saveAllChangesToDatabase(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.delete('mode');
      const base = pathname ?? '/';
      const newUrl = params.toString() ? `${base}?${params.toString()}` : base;
      router.push(newUrl);
      window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: false } }));
    });
  };

  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    const handleStageCloseEditor = () => {
      handleCloseRef.current();
    };
    window.addEventListener('stageToolbarCloseEditor', handleStageCloseEditor);
    return () => window.removeEventListener('stageToolbarCloseEditor', handleStageCloseEditor);
  }, []);

  // Track the offset from where the user clicked to the group's top-left corner
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  // Animation state for randomize
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [studentsAboutToMove, setStudentsAboutToMove] = useState<Set<string>>(new Set()); // Yellow
  const [studentsBeingPlaced, setStudentsBeingPlaced] = useState<Set<string>>(new Set()); // Blue

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
        // Check URL parameter for layout ID first, then localStorage, then default to first
        const layoutIdFromURL = searchParams?.get('layout');
        const storageKey = `seatingChart_selectedLayout_${classId}`;
        const layoutIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        
        if (data.length > 0) {
          // Priority: URL parameter > current context value > localStorage > first layout
          if (layoutIdFromURL && data.some((layout) => layout.id === layoutIdFromURL)) {
            if (activeSeatingLayoutId !== layoutIdFromURL) {
              setActiveSeatingLayoutId(layoutIdFromURL);
            }
          } else if (
            activeSeatingLayoutId !== null &&
            data.some((layout) => layout.id === activeSeatingLayoutId)
          ) {
            // Keep current context selection when it is still valid.
          } else if (layoutIdFromStorage && data.some((layout) => layout.id === layoutIdFromStorage)) {
            setActiveSeatingLayoutId(layoutIdFromStorage);
          } else {
            setActiveSeatingLayoutId(data[0].id);
          }
        } else if (activeSeatingLayoutId !== null) {
          setActiveSeatingLayoutId(null);
        }
      } else {
        setLayouts([]);
        if (activeSeatingLayoutId !== null) {
          setActiveSeatingLayoutId(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching seating charts:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [activeSeatingLayoutId, classId, searchParams, setActiveSeatingLayoutId]);

  // Fetch layouts from Supabase
  useEffect(() => {
    if (classId) {
      fetchLayouts();
    }
  }, [classId, fetchLayouts]);

  // Watch for URL parameter changes and update selected layout
  useEffect(() => {
    const layoutIdFromURL = searchParams?.get('layout');
    if (layoutIdFromURL && layouts.length > 0) {
      const layoutExists = layouts.find(l => l.id === layoutIdFromURL);
      if (layoutExists && activeSeatingLayoutId !== layoutIdFromURL) {
        setActiveSeatingLayoutId(layoutIdFromURL);
      }
    }
  }, [activeSeatingLayoutId, layouts, searchParams, setActiveSeatingLayoutId]);

  // Store selected layout ID in localStorage when it changes
  useEffect(() => {
    if (activeSeatingLayoutId && classId) {
      const storageKey = `seatingChart_selectedLayout_${classId}`;
      localStorage.setItem(storageKey, activeSeatingLayoutId);
    }
  }, [activeSeatingLayoutId, classId]);

  // Fetch layout settings (show_grid, show_objects, layout_orientation) when layout changes
  useEffect(() => {
    const fetchLayoutSettings = async () => {
      if (!activeSeatingLayoutId) return;
      
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('seating_charts')
          .select('show_grid, show_objects, layout_orientation')
          .eq('id', activeSeatingLayoutId)
          .single();

        if (error) {
          console.error('Error fetching layout settings:', error);
          return;
        }

        if (data) {
          // Set values from database (default to true/Left if null)
          applyLayoutViewSettings(data);
        }
      } catch (err) {
        console.error('Unexpected error fetching layout settings:', err);
      }
    };

    fetchLayoutSettings();
  }, [activeSeatingLayoutId, applyLayoutViewSettings]);

  // Keep view settings in sync without aggressive polling:
  // 1) local custom events, 2) realtime row updates, 3) low-frequency visible-tab fallback.
  useEffect(() => {
    if (!activeSeatingLayoutId) return;

    const supabase = createClient();

    const handleViewSettingsUpdate = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data, error } = await supabase
          .from('seating_charts')
          .select('show_grid, show_objects, layout_orientation')
          .eq('id', activeSeatingLayoutId)
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
      if (!detail || detail.layoutId !== activeSeatingLayoutId) return;
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
      .channel(`seating_chart_view_settings_${activeSeatingLayoutId}_editor`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seating_charts',
          filter: `id=eq.${activeSeatingLayoutId}`,
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

    // Low-frequency fallback in case realtime is unavailable.
    const interval = setInterval(handleViewSettingsUpdate, 15000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('seatingChartViewSettingsChanged', handleLocalSettingsEvent as EventListener);
      void supabase.removeChannel(realtimeChannel);
    };
  }, [activeSeatingLayoutId, applyLayoutViewSettings]);

  const fetchGroups = useCallback(async () => {
    if (!activeSeatingLayoutId) return;

    try {
      setIsLoadingGroups(true);
      const supabase = createClient();
      
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('seating_groups')
        .select('*')
        .eq('seating_chart_id', activeSeatingLayoutId)
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
              newPositions.set(group.id, getDefaultStaggerPosition(index));
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

          // Fixed-slot: store per-group list of { student, seat_index } (preserve holes)
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

          // Calculate unseated students: all students minus assigned students
          const assignedStudentIds = new Set(
            assignmentsData?.map((a: StudentSeatAssignment) => a.students?.id).filter(Boolean) || []
          );
          const unseated = students.filter(student => !assignedStudentIds.has(student.id));
          setUnseatedStudents(unseated);
        } else {
          // No groups, all students are unseated
          setGroupAssignments(new Map());
          setUnseatedStudents(students);
        }
      } else {
        setGroups([]);
        setGroupAssignments(new Map());
        setUnseatedStudents(students);
      }
    } catch (err) {
      console.error('Unexpected error fetching seating groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [activeSeatingLayoutId, students, setUnseatedStudents]);

  // Fetch groups when layout is selected or when shared roster changes
  useEffect(() => {
    if (activeSeatingLayoutId && students.length > 0) {
      fetchGroups();
    } else if (!activeSeatingLayoutId) {
      setGroups([]);
      setGroupAssignments(new Map());
    }
  }, [activeSeatingLayoutId, fetchGroups, students.length]);

  // Listen for student selection from sidebar
  useEffect(() => {
    const handleStudentSelected = (event: CustomEvent) => {
      const student = event.detail.student as Student;
      setSelectedStudentForGroup(student);
      // Show visual indicator that a student is ready to be placed
    };

    window.addEventListener('studentSelectedForGroup', handleStudentSelected as EventListener);
    return () => {
      window.removeEventListener('studentSelectedForGroup', handleStudentSelected as EventListener);
    };
  }, [setSelectedStudentForGroup]);


  /** Matches local grid math used previously in saveAllGroupSizes (header row + student rows, min 2). */
  const computeGroupRowsFromAssignments = useCallback(
    (assignmentsInGroup: GroupAssignment[], groupColumns: number) => {
      const studentsPerRow = groupColumns || 2;
      const maxIdx =
        assignmentsInGroup.length === 0 ? 0 : Math.max(...assignmentsInGroup.map((a) => a.seat_index));
      const studentRowCount = maxIdx === 0 ? 1 : Math.ceil(maxIdx / studentsPerRow);
      return Math.max(2, 1 + studentRowCount);
    },
    []
  );

  /**
   * Batch persist: group positions/sizes + full replace of seat assignments for the current layout.
   */
  const saveAllChangesToDatabase = useCallback(async (onSaveComplete?: () => void) => {
    if (!activeSeatingLayoutId) {
      showSuccessNotification('No layout', 'Select a seating layout before saving.');
      return;
    }
    if (groups.length === 0) {
      showSuccessNotification('Nothing to save', 'Create at least one group before saving.');
      return;
    }
    if (saveAllChangesInFlightRef.current) return;
    saveAllChangesInFlightRef.current = true;
    setIsSavingAllChanges(true);
    try {
      const supabase = createClient();
      const groupIds = groups.map((g) => g.id);
      const groupIdSet = new Set(groupIds);

      const updates = groups.map((group) => {
        const pos = groupPositions.get(group.id) ?? {
          x: group.position_x ?? 0,
          y: group.position_y ?? 0,
        };
        const assignmentsInGroup = groupAssignments.get(group.id) ?? [];
        const columns = group.group_columns || 2;
        const group_rows = computeGroupRowsFromAssignments(assignmentsInGroup, columns);
        return { group, pos, columns, group_rows };
      });

      const updateResults = await Promise.all(
        updates.map(({ group, pos, columns, group_rows }) =>
          supabase
            .from('seating_groups')
            .update({
              position_x: pos.x,
              position_y: pos.y,
              group_columns: columns,
              group_rows,
            })
            .eq('id', group.id)
        )
      );

      const firstGroupErr = updateResults.find((r) => r.error)?.error;
      if (firstGroupErr) {
        console.error('Error updating seating_groups:', firstGroupErr);
        showSuccessNotification('Error', firstGroupErr.message ?? 'Failed to update groups.');
        return;
      }

      if (groupIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('student_seat_assignments')
          .delete()
          .in('seating_group_id', groupIds);

        if (deleteError) {
          console.error('Error clearing seat assignments:', deleteError);
          showSuccessNotification('Error', deleteError.message ?? 'Failed to clear seat assignments.');
          return;
        }
      }

      const insertRows: { student_id: string; seating_group_id: string; seat_index: number }[] = [];
      groupAssignments.forEach((list, seatingGroupId) => {
        if (!groupIdSet.has(seatingGroupId)) return;
        for (const a of list) {
          insertRows.push({
            student_id: a.student.id,
            seating_group_id: seatingGroupId,
            seat_index: a.seat_index,
          });
        }
      });

      if (insertRows.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < insertRows.length; i += chunkSize) {
          const chunk = insertRows.slice(i, i + chunkSize);
          const { error: insertError } = await supabase.from('student_seat_assignments').insert(chunk);
          if (insertError) {
            console.error('Error inserting seat assignments:', insertError);
            showSuccessNotification('Error', insertError.message ?? 'Failed to save seat assignments.');
            return;
          }
        }
      }

      setGroups((prev) =>
        prev.map((g) => {
          const pos = groupPositions.get(g.id) ?? { x: g.position_x ?? 0, y: g.position_y ?? 0 };
          const assignmentsInGroup = groupAssignments.get(g.id) ?? [];
          const columns = g.group_columns || 2;
          const group_rows = computeGroupRowsFromAssignments(assignmentsInGroup, columns);
          return {
            ...g,
            position_x: pos.x,
            position_y: pos.y,
            group_columns: columns,
            group_rows,
          };
        })
      );

      showSuccessNotification('Saved', 'Your seating chart layout and assignments were saved.');
      onSaveComplete?.();
    } catch (err) {
      console.error('Unexpected error saving seating chart:', err);
      showSuccessNotification('Error', 'Failed to save changes. Please try again.');
    } finally {
      saveAllChangesInFlightRef.current = false;
      setIsSavingAllChanges(false);
    }
  }, [activeSeatingLayoutId, groups, groupAssignments, groupPositions, computeGroupRowsFromAssignments]);

  // Handle randomize seating - animated swap of all seated students
  const handleRandomizeSeating = useCallback(async () => {
    if (isRandomizing || groups.length === 0) return;
    
    setIsRandomizing(true);
    
    try {
      // First, record the size of each group (to maintain group sizes after randomization)
      const groupSizes: Map<string, number> = new Map();
      groupAssignments.forEach((assignments, groupId) => {
        groupSizes.set(groupId, assignments.length);
      });

      // Collect all seated students with their current groups
      const seatedStudents: Array<{ student: Student; currentGroupId: string }> = [];
      groupAssignments.forEach((assignments, groupId) => {
        assignments.forEach(({ student }) => {
          seatedStudents.push({ student, currentGroupId: groupId });
        });
      });

      if (seatedStudents.length === 0) {
        setIsRandomizing(false);
        return;
      }

      // Shuffle all students randomly
      const shuffledStudents = [...seatedStudents].sort(() => Math.random() - 0.5);
      
      // Create new assignments maintaining original group sizes
      const newAssignments: Array<{ student: Student; newGroupId: string; currentGroupId: string }> = [];
      const groupIds = groups.map(g => g.id);
      
      // Create a map to track how many students have been assigned to each group
      const groupAssignmentCounts: Map<string, number> = new Map();
      groupIds.forEach(groupId => {
        groupAssignmentCounts.set(groupId, 0);
      });
      
      // Distribute shuffled students back to groups maintaining original sizes
      let studentIndex = 0;
      for (const groupId of groupIds) {
        const targetSize = groupSizes.get(groupId) || 0;
        const currentCount = groupAssignmentCounts.get(groupId) || 0;
        const needed = targetSize - currentCount;
        
        // Assign the needed number of students to this group
        for (let i = 0; i < needed && studentIndex < shuffledStudents.length; i++) {
          const { student, currentGroupId } = shuffledStudents[studentIndex];
          newAssignments.push({ student, newGroupId: groupId, currentGroupId });
          groupAssignmentCounts.set(groupId, (groupAssignmentCounts.get(groupId) || 0) + 1);
          studentIndex++;
        }
      }

      // Animate each swap one by one
      for (let i = 0; i < newAssignments.length; i++) {
        const { student, newGroupId, currentGroupId } = newAssignments[i];
        
        // Skip if student is already in the target group
        if (currentGroupId === newGroupId) continue;

        // Show yellow (about to move)
        setStudentsAboutToMove(prev => new Set(prev).add(student.id));
        
        // Wait a bit before showing blue (increased from 300ms to 600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Show blue (being placed) and update local state
        setStudentsAboutToMove(prev => {
          const next = new Set(prev);
          next.delete(student.id);
          return next;
        });
        setStudentsBeingPlaced(prev => new Set(prev).add(student.id));
        
        // Update local state immediately for visual feedback (randomize uses 1..N per group)
        setGroupAssignments(prev => {
          const newMap = new Map(prev);
          const oldList = newMap.get(currentGroupId) ?? [];
          const newList = newMap.get(newGroupId) ?? [];
          const newIndexInNewGroup = newList.length + 1;
          newMap.set(currentGroupId, oldList.filter(a => a.student.id !== student.id));
          newMap.set(newGroupId, [...newList, { student, seat_index: newIndexInNewGroup }]);
          return newMap;
        });
        
        // Wait a bit before moving to next student (increased from 400ms to 800ms)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Remove blue state
        setStudentsBeingPlaced(prev => {
          const next = new Set(prev);
          next.delete(student.id);
          return next;
        });
      }

      // After all animations, update database
      const supabase = createClient();
      
      // Delete only assignments in the current layout's groups (so other layouts are untouched)
      const currentLayoutGroupIds = groups.map(g => g.id);
      if (currentLayoutGroupIds.length > 0) {
        await supabase
          .from('student_seat_assignments')
          .delete()
          .in('seating_group_id', currentLayoutGroupIds);
      }
      
      // Insert new assignments with seat_index 1, 2, 3, ... per group
      const nextSeatIndexByGroup = new Map<string, number>();
      groups.forEach(g => nextSeatIndexByGroup.set(g.id, 1));
      const assignmentsToInsert = newAssignments.map(({ student, newGroupId }) => {
        const seat_index = nextSeatIndexByGroup.get(newGroupId) ?? 1;
        nextSeatIndexByGroup.set(newGroupId, seat_index + 1);
        return { student_id: student.id, seating_group_id: newGroupId, seat_index };
      });
      
      if (assignmentsToInsert.length > 0) {
        await supabase
          .from('student_seat_assignments')
          .insert(assignmentsToInsert);
      }
      
      // Refresh to ensure sync
      await fetchGroups();
      
    } catch (err) {
      console.error('Error randomizing seating:', err);
      alert('Failed to randomize seating. Please try again.');
    } finally {
      // Clear all animation states
      setStudentsAboutToMove(new Set());
      setStudentsBeingPlaced(new Set());
      setIsRandomizing(false);
    }
  }, [isRandomizing, groups, groupAssignments, fetchGroups]);

  // Listen for randomize event
  useEffect(() => {
    const handleRandomize = () => {
      handleRandomizeSeating();
    };

    window.addEventListener('seatingChartRandomize', handleRandomize as EventListener);
    return () => {
      window.removeEventListener('seatingChartRandomize', handleRandomize as EventListener);
    };
  }, [handleRandomizeSeating]);

  // Listen for add student to group event. targetSeatIndex = fill hole / expand; omit = append at end.
  const addStudentToGroup = useCallback((student: Student, groupId: string, targetSeatIndex?: number) => {
    // Prevent double invocation (e.g. React Strict Mode or duplicate event)
    if (addStudentToGroupInFlightRef.current?.studentId === student.id && addStudentToGroupInFlightRef.current?.groupId === groupId) {
      return;
    }
    addStudentToGroupInFlightRef.current = { studentId: student.id, groupId };

    try {
      const currentInGroup = (groupAssignmentsRef.current.get(groupId) ?? []).map(a => a.student);
      if (currentInGroup.some((s) => s.id === student.id)) {
        setSelectedStudentForGroup(null);
        return;
      }

      const seatIndexToUse =
        targetSeatIndex != null
          ? targetSeatIndex
          : getNextSeatIndex(groupAssignmentsRef.current.get(groupId) ?? []);

      setGroupAssignments(prev => {
        const newMap = new Map(prev);
        const list = newMap.get(groupId) ?? [];
        if (!list.some(a => a.student.id === student.id)) {
          newMap.set(groupId, [...list, { student, seat_index: seatIndexToUse }]);
        }
        return newMap;
      });

      setUnseatedStudents((prev: Student[]) => prev.filter(s => s.id !== student.id));
      setSelectedStudentForGroup(null);
    } catch (err) {
      console.error('Unexpected error assigning student:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      if (addStudentToGroupInFlightRef.current?.studentId === student.id && addStudentToGroupInFlightRef.current?.groupId === groupId) {
        addStudentToGroupInFlightRef.current = null;
      }
    }
  }, [setUnseatedStudents, setSelectedStudentForGroup]);

  useEffect(() => {
    const handleAddStudentToGroup = (event: CustomEvent) => {
      const { studentId, groupId } = event.detail;
      if (selectedStudentForGroup && selectedStudentForGroup.id === studentId) {
        addStudentToGroup(selectedStudentForGroup, groupId);
      }
    };

    window.addEventListener('addStudentToGroup', handleAddStudentToGroup as EventListener);
    return () => {
      window.removeEventListener('addStudentToGroup', handleAddStudentToGroup as EventListener);
    };
  }, [selectedStudentForGroup, addStudentToGroup]);

  // Listen for save changes event from bottom nav
  useEffect(() => {
    const handleSaveSeatingChart = (event: Event) => {
      const detail = (event as CustomEvent<{ onSaveComplete?: () => void }>).detail;
      void saveAllChangesToDatabase(detail?.onSaveComplete);
    };

    window.addEventListener('seatingChartSave', handleSaveSeatingChart);
    return () => {
      window.removeEventListener('seatingChartSave', handleSaveSeatingChart);
    };
  }, [saveAllChangesToDatabase]);

  // Listen for clear all groups event from bottom nav
  useEffect(() => {
    const handleClearAllGroups = () => {
      setIsClearAllModalOpen(true);
    };

    window.addEventListener('seatingChartClearAllGroups', handleClearAllGroups);
    return () => {
      window.removeEventListener('seatingChartClearAllGroups', handleClearAllGroups);
    };
  }, []);

  // Listen for delete all groups event from bottom nav
  useEffect(() => {
    const handleDeleteAllGroups = () => {
      setIsDeleteAllModalOpen(true);
    };

    window.addEventListener('seatingChartDeleteAllGroups', handleDeleteAllGroups);
    return () => {
      window.removeEventListener('seatingChartDeleteAllGroups', handleDeleteAllGroups);
    };
  }, []);

  // Listen for color code by event from bottom nav
  useEffect(() => {
    const handleColorCodeBy = (event: CustomEvent) => {
      const { colorCodeBy: newColorCodeBy } = event.detail;
      setColorCodeBy(newColorCodeBy);
    };

    window.addEventListener('seatingChartColorCodeBy', handleColorCodeBy as EventListener);
    return () => {
      window.removeEventListener('seatingChartColorCodeBy', handleColorCodeBy as EventListener);
    };
  }, []);

  const removeStudentFromGroup = (studentId: string, groupId: string) => {
    let removedStudent: Student | undefined;
    setGroupAssignments(prev => {
      const newMap = new Map(prev);
      const list = newMap.get(groupId) ?? [];
      const found = list.find(a => a.student.id === studentId);
      if (found) removedStudent = found.student;
      if (removedStudent) {
        newMap.set(groupId, list.filter(a => a.student.id !== studentId));
      }
      return newMap;
    });

    if (removedStudent) {
      setUnseatedStudents((prev: Student[]) => {
        if (!prev.find(s => s.id === removedStudent!.id)) {
          return [...prev, removedStudent!];
        }
        return prev;
      });
    }
  };

  const handleCreateGroup = async (groupName: string, columns: number) => {
    if (!activeSeatingLayoutId) return;

    try {
      const supabase = createClient();
      
      // Get the max sort_order to place new group at the end
      const maxSortOrder = groups.length > 0 
        ? Math.max(...groups.map(g => g.sort_order))
        : -1;

      // Always place new groups in the top-left corner
      // User can then drag them to their desired location
      const initialX = 20;
      const initialY = 20;

      // Insert group with all parameters in a single operation
      // Calculate group_rows: 1 for header + at least 1 row for students (default to 2 total for new empty group)
      const defaultGroupRows = 2; // 1 header row + 1 student row for new empty groups

      const { data, error: insertError } = await supabase
        .from('seating_groups')
        .insert({
          name: groupName,
          seating_chart_id: activeSeatingLayoutId,
          sort_order: maxSortOrder + 1,
          group_columns: columns,
          group_rows: defaultGroupRows,
          position_x: initialX,
          position_y: initialY,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating seating group:', insertError);
        console.error('Insert data:', {
          name: groupName,
          seating_chart_id: activeSeatingLayoutId,
          sort_order: maxSortOrder + 1,
          group_columns: columns,
          position_x: initialX,
          position_y: initialY,
        });
        console.error('Full error details:', JSON.stringify(insertError, null, 2));
        alert(`Failed to create group: ${insertError.message || 'Please check the console for details.'}`);
        return;
      }

      if (data) {
        // Update local state with the new group position
        setGroupPositions(prev => {
          const newPositions = new Map(prev);
          newPositions.set(data.id, { x: initialX, y: initialY });
          return newPositions;
        });
        
        // Refresh groups to get the latest data
        await fetchGroups();
      }
    } catch (err) {
      console.error('Unexpected error creating seating group:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleAddMultipleGroups = useCallback(async (numGroups: number) => {
    if (!activeSeatingLayoutId) return;

    try {
      const supabase = createClient();
      
      // Get the max sort_order to place new groups at the end
      const maxSortOrder = groups.length > 0 
        ? Math.max(...groups.map(g => g.sort_order))
        : -1;

      const groupWidth = getBatchGroupWidth();

      // Default columns for new groups (using 2 as default, same as single group creation)
      const defaultColumns = 2;
      const defaultGroupRows = 2;

      // Calculate positions for each group in grid layout
      type GroupToCreate = {
        name: string;
        seating_chart_id: string;
        sort_order: number;
        group_columns: number;
        group_rows: number;
        position_x: number;
        position_y: number;
      };
      // Number new groups after existing ones: if we have 10 groups, new ones are Group 11, 12, ...
      const nextGroupNumber = groups.length + 1;
      const groupsToCreate: GroupToCreate[] = [];
      for (let i = 0; i < numGroups; i++) {
        const { x, y } = getBatchGroupPosition(i, groupWidth);
        
        groupsToCreate.push({
          name: `Group ${nextGroupNumber + i}`,
          seating_chart_id: activeSeatingLayoutId,
          sort_order: maxSortOrder + 1 + i,
          group_columns: defaultColumns,
          group_rows: defaultGroupRows,
          position_x: x,
          position_y: y,
        });
      }

      // Insert all groups at once
      const { data: insertedGroups, error: insertError } = await supabase
        .from('seating_groups')
        .insert(groupsToCreate)
        .select();

      if (insertError) {
        console.error('Error creating multiple groups:', insertError);
        alert(`Failed to create groups: ${insertError.message || 'Please check the console for details.'}`);
        return;
      }

      if (insertedGroups && insertedGroups.length > 0) {
        // Update local state with the new group positions
        setGroupPositions(prev => {
          const newPositions = new Map(prev);
          insertedGroups.forEach((group) => {
            const groupData = groupsToCreate.find(g => g.name === group.name);
            if (groupData) {
              newPositions.set(group.id, { x: groupData.position_x, y: groupData.position_y });
            }
          });
          return newPositions;
        });
        
        // Refresh groups to get the latest data
        await fetchGroups();
      }
    } catch (err) {
      console.error('Unexpected error creating multiple groups:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  }, [activeSeatingLayoutId, groups, fetchGroups]);

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
        // Refresh layouts and select the new one
        await fetchLayouts();
        setActiveSeatingLayoutId(data.id);
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      console.error('Unexpected error creating seating chart:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Native HTML5 drag handlers
  const handleDragStart = (e: React.DragEvent, groupId: string) => {
    // Prevent dragging if the group name is being edited
    if (editingGroupNameId === groupId) {
      e.preventDefault();
      return;
    }

    setDraggedGroupId(groupId);
    // Set drag image to be the element itself
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', groupId);
    
    // Calculate offset from where user clicked to the group's top-left corner
    if (e.currentTarget instanceof HTMLElement) {
      const groupRect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      // Store the offset from click position to group's top-left corner
      dragOffsetRef.current = {
        x: clickX - groupRect.left,
        y: clickY - groupRect.top
      };
      
      // Make the drag image semi-transparent
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedGroupId(null);
    dragOffsetRef.current = null; // Clear drag offset
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!canvasContainerRef.current || !draggedGroupId || !dragOffsetRef.current) {
      return;
    }

    const container = canvasContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculate where the group's top-left corner should be based on mouse position and offset
    const groupTopLeftX = e.clientX - dragOffsetRef.current.x;
    const groupTopLeftY = e.clientY - dragOffsetRef.current.y;
    
    // Get coordinates relative to the canvas container
    const relativeX = groupTopLeftX - containerRect.left;
    const relativeY = groupTopLeftY - containerRect.top;
    
    // Clamp to canvas bounds (prevent groups from going outside)
    const clampedX = Math.max(0, Math.min(relativeX, containerRect.width - GROUP_MIN_WIDTH));
    const clampedY = Math.max(0, Math.min(relativeY, containerRect.height - GROUP_MIN_HEIGHT));
    
    // Update the position immediately - free positioning, no snapping (persist via batch save later)
    setGroupPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedGroupId, { x: clampedX, y: clampedY });
      return newPositions;
    });

    setDraggedGroupId(null);
    dragOffsetRef.current = null; // Clear drag offset
  };

  const moveStudentToGroup = (studentId: string, fromGroupId: string, toGroupId: string, targetSeatIndex?: number) => {
    // Same group + target slot = move to empty seat within group
    if (fromGroupId === toGroupId && targetSeatIndex != null) {
      setGroupAssignments((prev) => {
        const newMap = new Map(prev);
        const list = (newMap.get(fromGroupId) ?? []).map((a) =>
          a.student.id === studentId ? { ...a, seat_index: targetSeatIndex } : a
        );
        newMap.set(fromGroupId, list);
        return newMap;
      });
      setSelectedStudentForSwap(null);
      return;
    }

    if (fromGroupId === toGroupId) {
      setSelectedStudentForSwap(null);
      return;
    }

    const fromList = groupAssignmentsRef.current.get(fromGroupId) ?? [];
    const foundFrom = fromList.find((a) => a.student.id === studentId);
    const studentToMove = foundFrom?.student;

    if (!studentToMove) {
      console.error('Student not found in source group');
      alert('Failed to move student. The student data may be out of sync.');
      setSelectedStudentForSwap(null);
      return;
    }

    const toList = groupAssignmentsRef.current.get(toGroupId) ?? [];
    const nextSeat = targetSeatIndex != null ? targetSeatIndex : getNextSeatIndex(toList);

    setGroupAssignments((prev) => {
      const newMap = new Map(prev);
      const src = (newMap.get(fromGroupId) ?? []).filter((a) => a.student.id !== studentId);
      const tgt = [...(newMap.get(toGroupId) ?? []), { student: studentToMove, seat_index: nextSeat }];
      newMap.set(fromGroupId, src);
      newMap.set(toGroupId, tgt);
      return newMap;
    });
    setSelectedStudentForSwap(null);
  };

  const handleSlotClick = (groupId: string, seatIndex: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedStudentForGroup) {
      addStudentToGroup(selectedStudentForGroup, groupId, seatIndex);
      return;
    }
    if (selectedStudentForSwap) {
      moveStudentToGroup(selectedStudentForSwap.studentId, selectedStudentForSwap.groupId, groupId, seatIndex);
      return;
    }
  };

  const handleExpandInColumn = (groupId: string, col: number, C: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSeat = nextSeatIndexInColumn(groupId, col, C);
    if (selectedStudentForGroup) {
      addStudentToGroup(selectedStudentForGroup, groupId, nextSeat);
      return;
    }
    if (selectedStudentForSwap) {
      moveStudentToGroup(selectedStudentForSwap.studentId, selectedStudentForSwap.groupId, groupId, nextSeat);
      return;
    }
  };

  const handleGroupClick = (groupId: string) => {
    if (selectedStudentForSwap) {
      moveStudentToGroup(selectedStudentForSwap.studentId, selectedStudentForSwap.groupId, groupId);
      return;
    }
    if (selectedStudentForGroup) {
      addStudentToGroup(selectedStudentForGroup, groupId);
    } else {
      setTargetGroupId(groupId);
    }
  };

  const handleStudentClick = (e: React.MouseEvent, studentId: string, groupId: string) => {
    e.stopPropagation(); // Prevent group click handler from firing
    e.preventDefault();
    
    // Disable clicking during randomize animation
    if (isRandomizing) {
      return;
    }
    
    if (!selectedStudentForSwap) {
      // First student selected - highlight it
      setSelectedStudentForSwap({ studentId, groupId });
    } else if (selectedStudentForSwap.studentId === studentId && selectedStudentForSwap.groupId === groupId) {
      // Clicking the same student - deselect
      setSelectedStudentForSwap(null);
    } else {
      // Second student selected - swap them
      console.log('Swapping students:', {
        student1: selectedStudentForSwap.studentId,
        group1: selectedStudentForSwap.groupId,
        student2: studentId,
        group2: groupId
      });
      swapStudents(selectedStudentForSwap.studentId, selectedStudentForSwap.groupId, studentId, groupId);
      setSelectedStudentForSwap(null);
    }
  };

  const swapStudents = (studentId1: string, groupId1: string, studentId2: string, groupId2: string) => {
    try {
      if (groupId1 === groupId2) {
        const assignments = groupAssignments.get(groupId1) ?? [];
        const a1 = assignments.find(a => a.student.id === studentId1);
        const a2 = assignments.find(a => a.student.id === studentId2);
        if (!a1 || !a2) {
          console.error('One or both students not found in group');
          return;
        }
        const s1 = a1.seat_index;
        const s2 = a2.seat_index;
        setGroupAssignments(prev => {
          const newMap = new Map(prev);
          const list = (newMap.get(groupId1) ?? []).map(a => {
            if (a.student.id === studentId1) return { ...a, seat_index: s2 };
            if (a.student.id === studentId2) return { ...a, seat_index: s1 };
            return a;
          });
          newMap.set(groupId1, list);
          return newMap;
        });
        return;
      }

      const list1 = groupAssignments.get(groupId1) ?? [];
      const list2 = groupAssignments.get(groupId2) ?? [];
      const a1 = list1.find(a => a.student.id === studentId1);
      const a2 = list2.find(a => a.student.id === studentId2);

      if (!a1 || !a2) {
        console.error('Students not found in expected groups:', {
          studentId1,
          studentId2,
          groupId1,
          groupId2,
        });
        alert('Failed to swap students. The student data may be out of sync. Please refresh the page and try again.');
        return;
      }

      const seatIndex1 = a1.seat_index;
      const seatIndex2 = a2.seat_index;
      const student1 = a1.student;
      const student2 = a2.student;

      setGroupAssignments(prev => {
        const newMap = new Map(prev);
        const g1 = (newMap.get(groupId1) ?? []).filter(a => a.student.id !== studentId1);
        const g2 = (newMap.get(groupId2) ?? []).filter(a => a.student.id !== studentId2);
        newMap.set(groupId1, [...g1, { student: student2, seat_index: seatIndex1 }]);
        newMap.set(groupId2, [...g2, { student: student1, seat_index: seatIndex2 }]);
        return newMap;
      });
    } catch (err) {
      console.error('Unexpected error swapping students:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleAssignSeats = useCallback(async () => {
    if (groups.length === 0) {
      alert('Please create at least one group before assigning seats.');
      return;
    }

    if (unseatedStudents.length === 0) {
      alert('No unseated students to assign.');
      return;
    }

    try {
      const supabase = createClient();
      
      const currentAssignments = groupAssignmentsRef.current;
      const totalSeatedStudents = Array.from(currentAssignments.values()).reduce(
        (sum, assignments) => sum + assignments.length,
        0
      );
      const totalStudents = totalSeatedStudents + unseatedStudents.length;
      const targetPerGroup = Math.floor(totalStudents / groups.length);
      const remainder = totalStudents % groups.length;
      const groupCurrentCounts = groups.map(group => {
        const list = currentAssignments.get(group.id) ?? [];
        const maxIdx = getMaxSeatIndexFromAssignments(list);
        return { groupId: group.id, currentCount: list.length, nextSeatIndex: maxIdx + 1 };
      });
      
      // Calculate how many students each group needs to reach target
      // Groups with index < remainder should have targetPerGroup + 1, others should have targetPerGroup
      const groupTargets = groups.map((group, index) => ({
        groupId: group.id,
        target: targetPerGroup + (index < remainder ? 1 : 0)
      }));
      
      // Calculate how many more students each group needs
      const groupNeeds = groupTargets.map((target, index) => {
        const current = groupCurrentCounts[index].currentCount;
        const needed = Math.max(0, target.target - current);
        return {
          groupId: target.groupId,
          needed: needed,
          target: target.target,
          current: current
        };
      });
      
      const shuffledStudents = [...unseatedStudents].sort(() => Math.random() - 0.5);
      const nextSeatIndexByGroup = new Map<string, number>();
      groupCurrentCounts.forEach(({ groupId, nextSeatIndex }) => nextSeatIndexByGroup.set(groupId, nextSeatIndex));
      const assignments: Array<{ student_id: string; seating_group_id: string; seat_index: number }> = [];
      let studentIndex = 0;
      const sortedGroupNeeds = [...groupNeeds].sort((a, b) => b.needed - a.needed);
      for (const groupNeed of sortedGroupNeeds) {
        for (let i = 0; i < groupNeed.needed && studentIndex < shuffledStudents.length; i++) {
          const seat_index = nextSeatIndexByGroup.get(groupNeed.groupId) ?? 1;
          nextSeatIndexByGroup.set(groupNeed.groupId, seat_index + 1);
          assignments.push({
            student_id: shuffledStudents[studentIndex].id,
            seating_group_id: groupNeed.groupId,
            seat_index,
          });
          studentIndex++;
        }
      }
      
      // Insert all assignments into database
      if (assignments.length > 0) {
        const { error: insertError } = await supabase
          .from('student_seat_assignments')
          .insert(assignments);

        if (insertError) {
          console.error('Error assigning seats:', insertError);
          alert('Failed to assign seats. Please try again.');
          return;
        }

        // Refresh groups to update the UI
        await fetchGroups();
        
        // Note: group_rows is calculated on the fly for responsiveness
        // Database will be updated when user clicks "Save Changes" button
      }
    } catch (err) {
      console.error('Unexpected error assigning seats:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  }, [groups, unseatedStudents, fetchGroups]);

  // Listen for add multiple groups event from bottom nav
  useEffect(() => {
    const handleAddMultipleGroupsEvent = (event: CustomEvent) => {
      const { numGroups } = event.detail;
      handleAddMultipleGroups(numGroups);
    };

    window.addEventListener('seatingChartAddMultipleGroups', handleAddMultipleGroupsEvent as EventListener);
    return () => {
      window.removeEventListener('seatingChartAddMultipleGroups', handleAddMultipleGroupsEvent as EventListener);
    };
  }, [handleAddMultipleGroups]);

  // Listen for auto assign seats event from bottom nav
  useEffect(() => {
    const handleAutoAssignSeatsEvent = () => {
      handleAssignSeats();
    };

    window.addEventListener('seatingChartAutoAssignSeats', handleAutoAssignSeatsEvent);
    return () => {
      window.removeEventListener('seatingChartAutoAssignSeats', handleAutoAssignSeatsEvent);
    };
  }, [handleAssignSeats]);

  const handleEditTeam = (groupId: string) => {
    const groupToEdit = groups.find(g => g.id === groupId);
    if (groupToEdit) {
      console.log('Opening edit modal for group:', groupToEdit);
      setEditingGroup(groupToEdit);
      setIsEditGroupModalOpen(true);
      setOpenSettingsMenuId(null);
    } else {
      console.error('Group not found:', groupId);
    }
  };

  const handleUpdateGroup = async (groupName: string, columns: number) => {
    if (!editingGroup) return;

    try {
      const supabase = createClient();
      
      // Update in database
      const { error: updateError } = await supabase
        .from('seating_groups')
        .update({
          name: groupName,
          group_columns: columns,
        })
        .eq('id', editingGroup.id);

      if (updateError) {
        console.error('Error updating group:', updateError);
        alert('Failed to update team. Please try again.');
        return;
      }

      // Fixed-slot: do not renumber when changing columns.

      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === editingGroup.id 
          ? { ...g, name: groupName, group_columns: columns }
          : g
      ));

      setIsEditGroupModalOpen(false);
      setEditingGroup(null);
    } catch (err) {
      console.error('Unexpected error updating group:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Handle double-click to edit group name
  const handleDoubleClickGroupName = (groupId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent group click handler
    setEditingGroupNameId(groupId);
    setEditingGroupNameValue(currentName);
  };

  // Handle saving edited group name
  const handleSaveGroupName = async (groupId: string) => {
    if (!editingGroupNameValue.trim()) {
      // If empty, revert to original name
      const originalGroup = groups.find(g => g.id === groupId);
      if (originalGroup) {
        setEditingGroupNameValue(originalGroup.name);
      }
      setEditingGroupNameId(null);
      return;
    }

    try {
      const supabase = createClient();
      
      // Update in database
      const { error: updateError } = await supabase
        .from('seating_groups')
        .update({
          name: editingGroupNameValue.trim(),
        })
        .eq('id', groupId);

      if (updateError) {
        console.error('Error updating group name:', updateError);
        alert('Failed to update group name. Please try again.');
        // Revert to original
        const originalGroup = groups.find(g => g.id === groupId);
        if (originalGroup) {
          setEditingGroupNameValue(originalGroup.name);
        }
        return;
      }

      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, name: editingGroupNameValue.trim() }
          : g
      ));

      setEditingGroupNameId(null);
      setEditingGroupNameValue('');
    } catch (err) {
      console.error('Unexpected error updating group name:', err);
      alert('An unexpected error occurred. Please try again.');
      // Revert to original
      const originalGroup = groups.find(g => g.id === groupId);
      if (originalGroup) {
        setEditingGroupNameValue(originalGroup.name);
      }
      setEditingGroupNameId(null);
    }
  };

  // Handle cancel editing group name
  const handleCancelEditGroupName = (groupId: string) => {
    const originalGroup = groups.find(g => g.id === groupId);
    if (originalGroup) {
      setEditingGroupNameValue(originalGroup.name);
    }
    setEditingGroupNameId(null);
  };

  const handleUpdateGroupColumns = async (groupId: string, columns: number) => {
    try {
      const supabase = createClient();
      
      // Update in database
      const { error: updateError } = await supabase
        .from('seating_groups')
        .update({
          group_columns: columns,
        })
        .eq('id', groupId);

      if (updateError) {
        console.error('Error updating group columns:', updateError);
        alert('Failed to update group columns. Please try again.');
        return;
      }

      // Fixed-slot: do not renumber when changing columns.

      setGroups(prev => prev.map(g =>
        g.id === groupId
          ? { ...g, group_columns: columns }
          : g
      ));
    } catch (err) {
      console.error('Unexpected error updating group columns:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleClearTeam = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setTeamToClear(group);
      setIsClearTeamModalOpen(true);
      setOpenSettingsMenuId(null);
    }
  };

  const handleClearTeamConfirmed = async () => {
    if (!teamToClear) return;

    try {
      const supabase = createClient();
      
      // Delete all student assignments for this group
      const { error: deleteError } = await supabase
        .from('student_seat_assignments')
        .delete()
        .eq('seating_group_id', teamToClear.id);

      if (deleteError) {
        console.error('Error clearing team:', deleteError);
        showSuccessNotification(
          'Error',
          'Failed to clear team. Please try again.'
        );
        setIsClearTeamModalOpen(false);
        setTeamToClear(null);
        return;
      }

      const studentsToUnseat = getStudentsInGroup(teamToClear.id);
      setGroupAssignments(prev => {
        const newMap = new Map(prev);
        newMap.set(teamToClear.id, []);
        return newMap;
      });
      
      // Add students back to unseated list (filter out duplicates)
      setUnseatedStudents((prev: Student[]) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newStudents = studentsToUnseat.filter(s => !existingIds.has(s.id));
        return [...prev, ...newStudents];
      });
      
      // Note: group_rows is calculated on the fly for responsiveness
      // Database will be updated when user clicks "Save Changes" button
      
      showSuccessNotification(
        'Team Cleared Successfully',
        `All students have been removed from "${teamToClear.name}" and moved back to the unseated list.`
      );
      setIsClearTeamModalOpen(false);
      setTeamToClear(null);
    } catch (err) {
      console.error('Unexpected error clearing team:', err);
      showSuccessNotification(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
      setIsClearTeamModalOpen(false);
      setTeamToClear(null);
    }
  };

  const handleDeleteTeam = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setTeamToDelete(group);
      setIsDeleteTeamModalOpen(true);
      setOpenSettingsMenuId(null);
    }
  };

  const handleDeleteTeamConfirmed = async () => {
    if (!teamToDelete) return;

    try {
      const supabase = createClient();
      
      // First, delete all student assignments for this group
      await supabase
        .from('student_seat_assignments')
        .delete()
        .eq('seating_group_id', teamToDelete.id);

      // Then delete the group itself
      const { error: deleteError } = await supabase
        .from('seating_groups')
        .delete()
        .eq('id', teamToDelete.id);

      if (deleteError) {
        console.error('Error deleting team:', deleteError);
        showSuccessNotification(
          'Error',
          'Failed to delete team. Please try again.'
        );
        setIsDeleteTeamModalOpen(false);
        setTeamToDelete(null);
        return;
      }

      const studentsToUnseat = getStudentsInGroup(teamToDelete.id);
      setGroupAssignments(prev => {
        const newMap = new Map(prev);
        newMap.delete(teamToDelete.id);
        return newMap;
      });
      
      setGroups(prev => prev.filter(g => g.id !== teamToDelete.id));
      // Remove from group positions
      setGroupPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.delete(teamToDelete.id);
        return newPositions;
      });
      
      // Add students back to unseated list (filter out duplicates)
      setUnseatedStudents((prev: Student[]) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newStudents = studentsToUnseat.filter(s => !existingIds.has(s.id));
        return [...prev, ...newStudents];
      });
      
      showSuccessNotification(
        'Team Deleted Successfully',
        `"${teamToDelete.name}" has been permanently deleted and students have been moved back to the unseated list.`
      );
      setIsDeleteTeamModalOpen(false);
      setTeamToDelete(null);
    } catch (err) {
      console.error('Unexpected error deleting team:', err);
      showSuccessNotification(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
      setIsDeleteTeamModalOpen(false);
      setTeamToDelete(null);
    }
  };

  const handleClearAllGroups = () => {
    setIsClearAllModalOpen(true);
  };

  const handleClearAllConfirmed = async () => {
    if (!activeSeatingLayoutId) {
      showSuccessNotification(
        'No Layout Selected',
        'Please select a layout before clearing groups.'
      );
      setIsClearAllModalOpen(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get all group IDs for the current layout
      const groupIds = groups.map(g => g.id);
      
      if (groupIds.length === 0) {
        showSuccessNotification(
          'No Groups to Clear',
          'There are no groups in the selected layout to clear.'
        );
        setIsClearAllModalOpen(false);
        return;
      }

      // Delete all student assignments for all groups in this layout
      // Delete each group's assignments
      let hasError = false;
      for (const groupId of groupIds) {
        const { error: deleteError } = await supabase
          .from('student_seat_assignments')
          .delete()
          .eq('seating_group_id', groupId);
        
        if (deleteError) {
          console.error(`Error clearing assignments for group ${groupId}:`, deleteError);
          hasError = true;
        }
      }

      if (hasError) {
        showSuccessNotification(
          'Error Clearing Groups',
          'Some errors occurred while clearing groups. Please check the console for details.'
        );
        setIsClearAllModalOpen(false);
        return;
      }

      const allStudentsToUnseat: Student[] = [];
      groupAssignments.forEach((assignments) => {
        assignments.forEach(a => allStudentsToUnseat.push(a.student));
      });
      setGroupAssignments(prev => {
        const newMap = new Map(prev);
        groupIds.forEach(groupId => newMap.set(groupId, []));
        return newMap;
      });

      // Add all students back to unseated list (filter out duplicates)
      setUnseatedStudents((prev: Student[]) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newStudents = allStudentsToUnseat.filter(s => !existingIds.has(s.id));
        return [...prev, ...newStudents];
      });

      showSuccessNotification(
        'Groups Cleared Successfully',
        'All students have been removed from all groups and moved back to the unseated list.'
      );
      setIsClearAllModalOpen(false);
    } catch (err) {
      console.error('Unexpected error clearing all groups:', err);
      showSuccessNotification(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
      setIsClearAllModalOpen(false);
    }
  };

  const handleDeleteAllGroups = () => {
    setIsDeleteAllModalOpen(true);
  };

  const handleDeleteAllConfirmed = async () => {
    if (!activeSeatingLayoutId) {
      showSuccessNotification(
        'No Layout Selected',
        'Please select a layout before deleting groups.'
      );
      setIsDeleteAllModalOpen(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get all group IDs for the current layout
      const groupIds = groups.map(g => g.id);
      
      if (groupIds.length === 0) {
        showSuccessNotification(
          'No Groups to Delete',
          'There are no groups in the selected layout to delete.'
        );
        setIsDeleteAllModalOpen(false);
        return;
      }

      // First, delete all student assignments for all groups
      let hasAssignmentError = false;
      for (const groupId of groupIds) {
        const { error: assignmentError } = await supabase
          .from('student_seat_assignments')
          .delete()
          .eq('seating_group_id', groupId);
        
        if (assignmentError) {
          console.error(`Error deleting assignments for group ${groupId}:`, assignmentError);
          hasAssignmentError = true;
        }
      }

      if (hasAssignmentError) {
        showSuccessNotification(
          'Error Deleting Assignments',
          'Some errors occurred while deleting student assignments. Please check the console for details.'
        );
        setIsDeleteAllModalOpen(false);
        return;
      }

      // Then delete all groups
      let hasGroupError = false;
      for (const groupId of groupIds) {
        const { error: groupError } = await supabase
          .from('seating_groups')
          .delete()
          .eq('id', groupId);
        
        if (groupError) {
          console.error(`Error deleting group ${groupId}:`, groupError);
          hasGroupError = true;
        }
      }

      if (hasGroupError) {
        showSuccessNotification(
          'Error Deleting Groups',
          'Some errors occurred while deleting groups. Please check the console for details.'
        );
        setIsDeleteAllModalOpen(false);
        return;
      }

      const allStudentsToUnseat: Student[] = [];
      groupAssignments.forEach((assignments) => {
        assignments.forEach(a => allStudentsToUnseat.push(a.student));
      });
      setGroups([]);
      setGroupAssignments(new Map());
      setGroupPositions(new Map());

      // Add all students back to unseated list (filter out duplicates)
      setUnseatedStudents((prev: Student[]) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newStudents = allStudentsToUnseat.filter(s => !existingIds.has(s.id));
        return [...prev, ...newStudents];
      });

      showSuccessNotification(
        'Groups Deleted Successfully',
        'All groups have been permanently deleted and students have been moved back to the unseated list.'
      );
      setIsDeleteAllModalOpen(false);
    } catch (err) {
      console.error('Unexpected error deleting all groups:', err);
      showSuccessNotification(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
      setIsDeleteAllModalOpen(false);
    }
  };

  // Calculate settings menu position when it opens
  useEffect(() => {
    if (openSettingsMenuId) {
      const settingsButton = document.querySelector(`[data-settings-button="${openSettingsMenuId}"]`) as HTMLElement;
      if (settingsButton) {
        const rect = settingsButton.getBoundingClientRect();
        setSettingsMenuPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right
        });
      }
    } else {
      setSettingsMenuPosition(null);
    }
  }, [openSettingsMenuId]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openSettingsMenuId) {
        // Check if the click is inside the settings menu or settings button
        const target = event.target as HTMLElement;
        const settingsMenu = document.querySelector('[data-settings-menu]');
        const settingsButton = document.querySelector(`[data-settings-button="${openSettingsMenuId}"]`);
        
        if (settingsMenu && settingsMenu.contains(target)) {
          return; // Click is inside the menu, don't close
        }
        if (settingsButton && settingsButton.contains(target)) {
          return; // Click is on the settings button, don't close (it will toggle)
        }
        
        setOpenSettingsMenuId(null);
      }
    };

    if (openSettingsMenuId) {
      // Use a small delay to allow button clicks to fire first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openSettingsMenuId]);


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
      <div className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-center">
            <h2 className="text-white text-2xl font-semibold mb-2">No seating charts yet</h2>
            <p className="text-white/80 text-lg">
              Create your first seating chart layout to get started.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-8 py-3 bg-purple-400 text-white rounded-lg font-semibold text-lg hover:bg-purple-500 transition-colors shadow-lg"
          >
            Create New Layout
          </button>
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
    <div className="font-spartan relative w-full h-full min-h-0 bg-brand-purple">
      {/* Main Content Area */}
      <div className="w-full h-full min-h-0 bg-brand-purple relative overflow-visible">
        <div className="h-full min-h-0 relative" style={{ zIndex: 1 }}>

        {/* Seating Groups Canvas */}
        <div className="h-full min-h-0 flex flex-col relative">
          {/* Canvas for groups display */}
          <div 
            className="bg-brand-cream border-2 border-black rounded-lg pt-2 h-full w-full relative"
            style={{
              overflow: 'auto',
              zIndex: 1
            }}
          >
          <SeatingCanvasDecor
            showGrid={showGrid}
            showObjects={showObjects}
            layoutOrientation={layoutOrientation}
            borderClassName="border-black"
          />
          {isLoadingGroups ? (
            <div className="flex items-center justify-center p-8 relative" style={{ zIndex: 1 }}>
              <p className="text-white/80">Loading groups...</p>
            </div>
          ) : groups.length > 0 && (
            <div
              ref={canvasContainerRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 1
                    }}
                  >
                    {groups.map((group, index) => {
                      const assignmentsInGroup = getAssignmentsInGroup(group.id);
                      const isTarget = selectedStudentForGroup && targetGroupId === group.id;
                      const { validColumns, numRows, groupWidth, groupHeight } = getGroupRenderLayout(
                        group.group_columns,
                        assignmentsInGroup
                      );
                      const position = groupPositions.get(group.id) || getDefaultStaggerPosition(index);
                      const groupX = position.x;
                      const groupY = position.y;
                      
                      const studentCardHeight = 32;
                      const studentPointsWidth = 34;

                      // Render student card component
                      const renderStudentCard = (student: Student) => {
                        const isSelected = selectedStudentForSwap?.studentId === student.id && selectedStudentForSwap?.groupId === group.id;
                        const isAboutToMove = studentsAboutToMove.has(student.id);
                        const isBeingPlaced = studentsBeingPlaced.has(student.id);
                        
                        // Determine background color based on animation state first, then gender (if color by gender is enabled)
                        let bgColor = 'bg-white border-gray-200 hover:bg-gray-50';
                        if (isAboutToMove) {
                          bgColor = 'bg-yellow-300 border-yellow-500 hover:bg-yellow-400';
                        } else if (isBeingPlaced) {
                          bgColor = 'bg-blue-300 border-blue-500 hover:bg-blue-400';
                        } else if (isSelected) {
                          bgColor = 'bg-yellow-300 border-yellow-500 hover:bg-yellow-400';
                        } else {
                          // Only color by gender if the toggle is ON
                          if (colorCodeBy === 'Gender') {
                            // Check gender for background color
                            if (student.gender === null || student.gender === undefined || student.gender === '') {
                              // NULL/unassigned gender = white background
                              bgColor = 'bg-white border-gray-200 hover:bg-gray-50';
                            } else if (student.gender === 'Boy') {
                              // Boy = blue background
                              bgColor = 'bg-blue-200 border-blue-300 hover:bg-blue-300';
                            } else if (student.gender === 'Girl') {
                              // Girl = pink background
                              bgColor = 'bg-pink-200 border-pink-300 hover:bg-pink-300';
                            }
                          } else {
                            // Color by gender is OFF - all students are white
                            bgColor = 'bg-white border-gray-200 hover:bg-gray-50';
                          }
                        }
                        
                        return (
                          <div
                            key={student.id}
                            onClick={(e) => handleStudentClick(e, student.id, group.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`flex items-center gap-1 p-1.5 rounded border transition-colors min-w-0 overflow-hidden ${
                              isRandomizing ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${bgColor}`}
                            style={{ 
                              width: '100%',
                              height: `${studentCardHeight}px`
                            }}
                          >
                            <div className="flex-1 min-w-0 flex items-center gap-2 pr-1">
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isRandomizing) {
                                  removeStudentFromGroup(student.id, group.id);
                                }
                              }}
                              className={`p-0.5 flex-shrink-0 ${
                                isRandomizing 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-500 hover:text-red-700'
                              }`}
                              style={{ width: '16px', height: '16px' }}
                              title={isRandomizing ? 'Cannot remove during animation' : 'Remove from group'}
                              disabled={isRandomizing}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      };
                      
                      const isEditingName = editingGroupNameId === group.id;
                      // Check if a student is selected for swap and this group is a valid target (not the source group)
                      const isTargetForMove = selectedStudentForSwap && selectedStudentForSwap.groupId !== group.id;
                            
                            return (
                            <div
                          key={group.id}
                          draggable={!isEditingName}
                          onDragStart={(e) => handleDragStart(e, group.id)}
                          onDragEnd={handleDragEnd}
                              onClick={() => handleGroupClick(group.id)}
                          className={`bg-white rounded-lg border-2 shadow-lg flex flex-col ${
                            draggedGroupId === group.id ? 'shadow-2xl border-purple-600 opacity-50' : 
                                isTarget ? 'border-purple-500 ring-4 ring-purple-300' :
                            isTargetForMove ? 'border-green-400 hover:border-green-500 cursor-pointer ring-2 ring-green-200' :
                                selectedStudentForGroup ? 'border-purple-400 hover:border-purple-500 cursor-pointer' :
                                'border-gray-300'
                              }`}
                              style={{
                            position: 'absolute',
                            left: `${groupX}px`,
                            top: `${groupY}px`,
                            width: `${groupWidth}px`,
                            height: `${groupHeight}px`,
                            zIndex: draggedGroupId === group.id ? 9999 : 1,
                            boxSizing: 'border-box',
                            gap: 0,
                            overflow: 'hidden',
                            transition: 'none',
                            pointerEvents: 'auto'
                          }}
                        >
                          {/* Group Header - Row 1 */}
                          <div
                            className={`border-b border-gray-200 bg-purple-50 rounded-t-lg relative ${
                              isEditingName ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                            }`}
                                  style={{
                                    height: '50px',
                                    minHeight: '50px',
                                    maxHeight: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 0.5rem', // p-2 equivalent but more controlled
                                    boxSizing: 'border-box'
                                  }}
                                >
                                {/* Team Name */}
                                  <div 
                                    className="flex-1 relative group"
                                    onDoubleClick={(e) => handleDoubleClickGroupName(group.id, group.name, e)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    {editingGroupNameId === group.id ? (
                                      <input
                                        type="text"
                                        value={editingGroupNameValue}
                                        onChange={(e) => setEditingGroupNameValue(e.target.value)}
                                        onBlur={() => handleSaveGroupName(group.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveGroupName(group.id);
                                          } else if (e.key === 'Escape') {
                                            handleCancelEditGroupName(group.id);
                                          }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="font-semibold text-gray-800 bg-white border border-purple-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                        <IconEditPencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Column Radio Buttons */}
                                  <div className="flex items-center gap-2 mr-8" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                    {[1, 2, 3].map((cols) => (
                                      <label
                                        key={cols}
                                        className="flex items-center gap-1 cursor-pointer"
                                        title={`${cols} column${cols > 1 ? 's' : ''}`}
                                      >
                                        <input
                                          type="radio"
                                          name={`group-columns-${group.id}`}
                                          value={cols}
                                          checked={validColumns === cols}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            handleUpdateGroupColumns(group.id, cols);
                                          }}
                                          className="w-3 h-3 text-purple-600 bg-white border-gray-300 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-600 font-medium">{cols}</span>
                                      </label>
                                    ))}
                                  </div>

                                {/* Settings Icon - Top Right */}
                                <button
                                  data-settings-button={group.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSettingsMenuId(openSettingsMenuId === group.id ? null : group.id);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute top-2 right-2 p-1 hover:bg-purple-100 rounded transition-colors"
                                  title="Settings"
                                >
                                  <IconSettingsWheel className="w-5 h-5 text-gray-600" />
                                </button>

                                {/* Settings Dropdown Menu */}
                                {openSettingsMenuId === group.id && settingsMenuPosition && (
                                  <div
                                    data-settings-menu
                                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[140px]"
                                    style={{
                                      top: `${settingsMenuPosition.top}px`,
                                      right: `${settingsMenuPosition.right}px`,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Edit Team button clicked for group:', group.id);
                                        handleEditTeam(group.id);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                                    >
                                      Edit Team
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearTeam(group.id);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Clear Team
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTeam(group.id);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                                    >
                                      Delete Team
                                    </button>
                                  </div>
                                )}
                              </div>

                                {/* Fixed-slot grid: row = ceil(index/C), col = (index-1) % C */}
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
                                      const slotIndex = getSlotIndex(rowIndex, colIndex, validColumns);
                                      const student = studentAtSlot(group.id, slotIndex);
                                      if (student) {
                                        return (
                                          <div key={slotIndex} className="w-full min-w-0" onMouseDown={(e) => e.stopPropagation()}>
                                            {renderStudentCard(student)}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div
                                          key={slotIndex}
                                          onClick={handleSlotClick(group.id, slotIndex)}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          className={`rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs ${
                                            selectedStudentForGroup || isTargetForMove ? 'cursor-pointer hover:border-purple-400 hover:bg-purple-50' : 'cursor-default'
                                          }`}
                                          style={{ height: `${studentCardHeight}px` }}
                                        >
                                          {selectedStudentForGroup || isTargetForMove ? 'Drop here' : 'Empty'}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                                {/* Expand row: add to bottom of column */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${validColumns}, 1fr)`,
                                    gap: '0.5rem',
                                    padding: '0 0.5rem',
                                    backgroundColor: '#f3f4f6',
                                    height: `${GROUP_EXPAND_ROW_HEIGHT}px`,
                                    minHeight: `${GROUP_EXPAND_ROW_HEIGHT}px`,
                                    boxSizing: 'border-box',
                                    alignItems: 'center'
                                  }}
                                >
                                  {Array.from({ length: validColumns }, (_, colIndex) => (
                                    <div
                                      key={`expand-${colIndex}`}
                                      onClick={handleExpandInColumn(group.id, colIndex, validColumns)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      className={`flex items-center justify-center text-gray-500 text-xs rounded border border-dashed border-gray-300 min-h-[28px] ${
                                        selectedStudentForGroup || isTargetForMove ? 'cursor-pointer hover:border-purple-400 hover:bg-purple-50' : 'cursor-default'
                                      }`}
                                    >
                                      + Add
                                    </div>
                                  ))}
                                </div>
                            </div>
                      );
                    })}
                  </div>
          )}
          </div>
        </div>
        </div>
      </div>

      {/* Create Layout Modal */}
      <CreateLayoutModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLayout={handleCreateLayout}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={isEditGroupModalOpen && editingGroup !== null}
        onClose={() => {
          setIsEditGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onUpdateGroup={handleUpdateGroup}
        initialName={editingGroup?.name || ''}
        initialColumns={editingGroup?.group_columns || 2}
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleClearAllConfirmed}
        title="Clear All Students"
        message="Are you sure you want to clear all students from all groups? This will remove all student assignments but keep the groups. Students will be moved back to the unseated list."
        confirmText="Clear All"
        cancelText="Cancel"
        confirmButtonColor="orange"
        icon={
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
            <svg
              className="h-6 w-6 text-orange-600"
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

      {/* Delete All Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAllConfirmed}
        title="Delete All Groups"
        message="Are you sure you want to delete ALL groups? This action cannot be undone and will permanently remove all groups and their student assignments. Students will be moved back to the unseated list."
        confirmText="Delete All"
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        }
      />

      {/* Clear Team Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearTeamModalOpen}
        onClose={() => {
          setIsClearTeamModalOpen(false);
          setTeamToClear(null);
        }}
        onConfirm={handleClearTeamConfirmed}
        title="Clear Team"
        message={teamToClear ? `Are you sure you want to clear all students from "${teamToClear.name}"? This will remove all student assignments from this team but keep the team. Students will be moved back to the unseated list.` : ''}
        confirmText="Clear Team"
        cancelText="Cancel"
        confirmButtonColor="orange"
        icon={
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
            <svg
              className="h-6 w-6 text-orange-600"
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

      {/* Delete Team Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteTeamModalOpen}
        onClose={() => {
          setIsDeleteTeamModalOpen(false);
          setTeamToDelete(null);
        }}
        onConfirm={handleDeleteTeamConfirmed}
        title="Delete Team"
        message={teamToDelete ? `Are you sure you want to delete "${teamToDelete.name}"? This action cannot be undone and will permanently remove this team and all student assignments. Students will be moved back to the unseated list.` : ''}
        confirmText="Delete Team"
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        }
      />

      {/* Success Notification Modal */}
      <SuccessNotificationModal
        isOpen={successNotification.isOpen}
        onClose={() => setSuccessNotification({ isOpen: false, title: '', message: '' })}
        title={successNotification.title}
        message={successNotification.message}
        type={successNotification.title.includes('Error') || successNotification.title.includes('No') ? 'error' : 'success'}
        icon={
          successNotification.title.includes('Error') || successNotification.title.includes('No') ? (
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )
        }
        autoCloseDelay={successNotification.title.includes('Error') || successNotification.title.includes('No') ? 3000 : 2000}
      />
    </div>
  );
}

