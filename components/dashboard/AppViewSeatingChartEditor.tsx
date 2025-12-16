'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';
import EditGroupModal from '@/components/modals/EditGroupModal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import SuccessNotificationModal from '@/components/modals/SuccessNotificationModal';
import LeftNavSeatingChartEdit from '@/components/dashboard/navbars/LeftNavSeatingChartEdit';

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
  students: Student | null;
}

interface AppViewSeatingChartEditorProps {
  classId: string;
}

export default function AppViewSeatingChartEditor({ classId }: AppViewSeatingChartEditorProps) {
  const { selectedStudentForGroup, setSelectedStudentForGroup, setUnseatedStudents, unseatedStudents } = useSeatingChart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
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
  const [editingGroup, setEditingGroup] = useState<SeatingGroup | null>(null);
  const [groupStudents, setGroupStudents] = useState<Map<string, Student[]>>(new Map());
  const groupStudentsRef = useRef<Map<string, Student[]>>(new Map());
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    groupStudentsRef.current = groupStudents;
  }, [groupStudents]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [openSettingsMenuId, setOpenSettingsMenuId] = useState<string | null>(null);
  const [settingsMenuPosition, setSettingsMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [selectedStudentForSwap, setSelectedStudentForSwap] = useState<{ studentId: string; groupId: string } | null>(null);
  const [editingGroupNameId, setEditingGroupNameId] = useState<string | null>(null);
  const [editingGroupNameValue, setEditingGroupNameValue] = useState<string>('');
  // Store pixel positions for each group (x, y coordinates)
  const [groupPositions, setGroupPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const leftSidebarRef = useRef<HTMLDivElement | null>(null);
  const [canvasLeft, setCanvasLeft] = useState(320); // Default left position (8px sidebar left + 304px width + 8px spacing)
  // Track which group is being dragged
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  // Color coding mode: "Gender" or "Level"
  const [colorCodeBy, setColorCodeBy] = useState<'Gender' | 'Level'>('Gender');
  // View settings from database
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showObjects, setShowObjects] = useState<boolean>(true);
  const [layoutOrientation, setLayoutOrientation] = useState<string>('Left');
  
  // Helper function to show success notification
  const showSuccessNotification = (title: string, message: string) => {
    setSuccessNotification({ isOpen: true, title, message });
  };

  // Handle close button - navigate back to seating chart view (remove mode=edit)
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: false } }));
    const params = new URLSearchParams(searchParams.toString());
    params.delete('mode');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  // Calculate canvas left position based on left sidebar position
  useEffect(() => {
    const updateCanvasLeft = () => {
      if (leftSidebarRef.current) {
        const rect = leftSidebarRef.current.getBoundingClientRect();
        // Start canvas right after the sidebar with 8px spacing
        // Sidebar: left: 8px, width: 304px (w-76), so right edge is at 312px
        // Canvas should start at 312px + 8px spacing = 320px
        const sidebarRight = rect.left + rect.width;
        const newLeft = sidebarRight + 8;
        setCanvasLeft(newLeft);
      } else {
        // Fallback: sidebar is 8px left + 304px width (w-76) + 8px spacing = 320px
        setCanvasLeft(320);
      }
    };
    
    // Initial update with a small delay to ensure sidebar is rendered
    const timeoutId = setTimeout(updateCanvasLeft, 10);
    updateCanvasLeft();
    
    window.addEventListener('resize', updateCanvasLeft);
    const interval = setInterval(updateCanvasLeft, 100); // Update periodically to catch sidebar changes
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasLeft);
      clearInterval(interval);
    };
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
        const layoutIdFromURL = searchParams.get('layout');
        const storageKey = `seatingChart_selectedLayout_${classId}`;
        const layoutIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        
        if (data.length > 0) {
          // Priority: URL parameter > localStorage > first layout
          // Always check URL parameter first, even if selectedLayoutId is already set
          if (layoutIdFromURL && data.find(l => l.id === layoutIdFromURL)) {
            // Update if URL parameter is different from current selection
            if (selectedLayoutId !== layoutIdFromURL) {
              setSelectedLayoutId(layoutIdFromURL);
            }
          } else if (!selectedLayoutId) {
            // Only use localStorage or first layout if no URL parameter and no current selection
            if (layoutIdFromStorage && data.find(l => l.id === layoutIdFromStorage)) {
              setSelectedLayoutId(layoutIdFromStorage);
            } else {
          setSelectedLayoutId(data[0].id);
            }
          }
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
  }, [classId, selectedLayoutId, searchParams]);

  // Fetch layouts from Supabase
  useEffect(() => {
    if (classId) {
      fetchLayouts();
    }
  }, [classId, fetchLayouts]);

  // Watch for URL parameter changes and update selected layout
  useEffect(() => {
    const layoutIdFromURL = searchParams.get('layout');
    if (layoutIdFromURL && layouts.length > 0) {
      const layoutExists = layouts.find(l => l.id === layoutIdFromURL);
      if (layoutExists && selectedLayoutId !== layoutIdFromURL) {
        setSelectedLayoutId(layoutIdFromURL);
      }
    }
  }, [searchParams, layouts, selectedLayoutId]);

  // Store selected layout ID in localStorage when it changes
  useEffect(() => {
    if (selectedLayoutId && classId) {
      const storageKey = `seatingChart_selectedLayout_${classId}`;
      localStorage.setItem(storageKey, selectedLayoutId);
    }
  }, [selectedLayoutId, classId]);

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
          // Set values from database (default to true/Left if null)
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

  // Listen for view settings updates from bottom nav (polling approach)
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
            .in('seating_group_id', groupIds);

          if (assignmentsError) {
            console.error('Error fetching student seat assignments:', assignmentsError);
            // Continue with empty assignments
          }

          // Organize students by group
          const newGroupStudents = new Map<string, Student[]>();
          groupsData.forEach(group => {
            newGroupStudents.set(group.id, []);
          });

          if (assignmentsData) {
            assignmentsData.forEach((assignment: StudentSeatAssignment) => {
              const groupId = assignment.seating_group_id;
              const student = assignment.students;
              if (student && newGroupStudents.has(groupId)) {
                const currentStudents = newGroupStudents.get(groupId) || [];
                // Check for duplicates before adding
                if (!currentStudents.find(s => s.id === student.id)) {
                  newGroupStudents.set(groupId, [...currentStudents, student]);
                }
              }
            });
          }

          setGroupStudents(newGroupStudents);

          // Calculate unseated students: all students minus assigned students
          const assignedStudentIds = new Set(
            assignmentsData?.map((a: StudentSeatAssignment) => a.students?.id).filter(Boolean) || []
          );
          const unseated = allStudents.filter(student => !assignedStudentIds.has(student.id));
          setUnseatedStudents(unseated);
        } else {
          // No groups, all students are unseated
          setGroupStudents(new Map());
          setUnseatedStudents(allStudents);
        }
      } else {
        setGroups([]);
        setGroupStudents(new Map());
        setUnseatedStudents(allStudents);
      }
    } catch (err) {
      console.error('Unexpected error fetching seating groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [selectedLayoutId, allStudents, setUnseatedStudents]);

  // Fetch groups when layout is selected or when allStudents changes
  useEffect(() => {
    if (selectedLayoutId && allStudents.length > 0) {
      fetchGroups();
    } else if (!selectedLayoutId) {
      setGroups([]);
      setGroupStudents(new Map());
    }
  }, [selectedLayoutId, fetchGroups, allStudents.length]);

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


  // Function to save all group_rows and group_columns to database
  // Called when user clicks "Save Changes" button
  const saveAllGroupSizes = useCallback(async () => {
    try {
      const supabase = createClient();
      
      // Calculate and prepare updates for all groups
      const updates = groups.map(group => {
        const studentsInGroup = groupStudents.get(group.id) || [];
        const studentsPerRow = group.group_columns || 2;
        
        // Calculate student rows needed (always at least 1)
        const studentRowCount = studentsInGroup.length === 0 
          ? 1  // Empty group: 1 student row
          : Math.ceil(studentsInGroup.length / studentsPerRow);
        
        // Total rows = 1 header + student rows (minimum 2)
        const totalRowCount = Math.max(2, 1 + studentRowCount);
        
        return {
          id: group.id,
          group_rows: totalRowCount,
          group_columns: group.group_columns || 2,
        };
      });
      
      // Update all groups in database
      for (const update of updates) {
        const { error } = await supabase
          .from('seating_groups')
          .update({
            group_rows: update.group_rows,
            group_columns: update.group_columns,
          })
          .eq('id', update.id);
        
        if (error) {
          console.error(`Error updating group ${update.id}:`, error);
          console.error('Update data:', { 
            group_rows: update.group_rows, 
            group_columns: update.group_columns,
            id: update.id 
          });
          console.error('Full error details:', JSON.stringify(error, null, 2));
        }
      }
      
      // Update local state with calculated values
      setGroups(prev => prev.map(g => {
        const update = updates.find(u => u.id === g.id);
        if (update) {
          return { ...g, group_rows: update.group_rows, group_columns: update.group_columns };
        }
        return g;
      }));
      
      console.log('All group sizes saved to database');
    } catch (err) {
      console.error('Unexpected error saving group sizes:', err);
      alert('Failed to save changes. Please try again.');
    }
  }, [groups, groupStudents]);

  // Handle randomize seating - animated swap of all seated students
  const handleRandomizeSeating = useCallback(async () => {
    if (isRandomizing || groups.length === 0) return;
    
    setIsRandomizing(true);
    
    try {
      // First, record the size of each group (to maintain group sizes after randomization)
      const groupSizes: Map<string, number> = new Map();
      groupStudents.forEach((students, groupId) => {
        groupSizes.set(groupId, students.length);
      });

      // Collect all seated students with their current groups
      const seatedStudents: Array<{ student: Student; currentGroupId: string }> = [];
      groupStudents.forEach((students, groupId) => {
        students.forEach(student => {
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
        
        // Update local state immediately for visual feedback
        setGroupStudents(prev => {
          const newMap = new Map(prev);
          
          // Remove from old group
          const oldGroupStudents = newMap.get(currentGroupId) || [];
          const filteredOld = oldGroupStudents.filter(s => s.id !== student.id);
          newMap.set(currentGroupId, filteredOld);
          
          // Add to new group
          const newGroupStudents = newMap.get(newGroupId) || [];
          newMap.set(newGroupId, [...newGroupStudents, student]);
          
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
      
      // Delete all current assignments
      const allStudentIds = seatedStudents.map(s => s.student.id);
      if (allStudentIds.length > 0) {
        await supabase
          .from('student_seat_assignments')
          .delete()
          .in('student_id', allStudentIds);
      }
      
      // Insert new assignments
      const assignmentsToInsert = newAssignments.map(({ student, newGroupId }) => ({
        student_id: student.id,
        seating_group_id: newGroupId,
      }));
      
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
  }, [isRandomizing, groups, groupStudents, fetchGroups]);

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

  // Listen for add student to group event
  const addStudentToGroup = useCallback(async (student: Student, groupId: string) => {
    try {
      const supabase = createClient();
      
      // Insert assignment into database
      const { error: insertError } = await supabase
        .from('student_seat_assignments')
        .insert({
          student_id: student.id,
          seating_group_id: groupId,
        });

      if (insertError) {
        console.error('Error assigning student to group:', insertError);
        alert('Failed to assign student. Please try again.');
        return;
      }

      // Update local state
      setGroupStudents(prev => {
        const newMap = new Map(prev);
        const groupStudentsList = newMap.get(groupId) || [];
        // Check if student is already in this group
        if (!groupStudentsList.find(s => s.id === student.id)) {
          newMap.set(groupId, [...groupStudentsList, student]);
        }
        return newMap;
      });
      
      // Remove from unseated list
      setUnseatedStudents((prev: Student[]) => prev.filter(s => s.id !== student.id));
      setSelectedStudentForGroup(null);
      
      // Note: group_rows is calculated on the fly for responsiveness
      // Database will be updated when user clicks "Save Changes" button
    } catch (err) {
      console.error('Unexpected error assigning student:', err);
      alert('An unexpected error occurred. Please try again.');
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
    const handleSaveSeatingChart = () => {
      saveAllGroupSizes();
    };

    window.addEventListener('seatingChartSave', handleSaveSeatingChart);
    return () => {
      window.removeEventListener('seatingChartSave', handleSaveSeatingChart);
    };
  }, [saveAllGroupSizes]);

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

  const removeStudentFromGroup = async (studentId: string, groupId: string) => {
    try {
      const supabase = createClient();
      
      // Delete assignment from database
      const { error: deleteError } = await supabase
        .from('student_seat_assignments')
        .delete()
        .eq('student_id', studentId)
        .eq('seating_group_id', groupId);

      if (deleteError) {
        console.error('Error removing student from group:', deleteError);
        alert('Failed to remove student. Please try again.');
        return;
      }

      // Update local state
      let removedStudent: Student | undefined;
      setGroupStudents(prev => {
        const newMap = new Map(prev);
        const groupStudentsList = newMap.get(groupId) || [];
        removedStudent = groupStudentsList.find(s => s.id === studentId);
        
        if (removedStudent) {
          newMap.set(groupId, groupStudentsList.filter(s => s.id !== studentId));
        }
        return newMap;
      });
      
      // Add back to unseated list (check for duplicates first) - outside of setGroupStudents callback
      if (removedStudent) {
          setUnseatedStudents((prev: Student[]) => {
            // Check if student is already in the list
          if (!prev.find(s => s.id === removedStudent!.id)) {
            return [...prev, removedStudent!];
            }
            return prev;
          });
        }
      
      // Note: group_rows is calculated on the fly for responsiveness
      // Database will be updated when user clicks "Save Changes" button
    } catch (err) {
      console.error('Unexpected error removing student:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleCreateGroup = async (groupName: string, columns: number) => {
    if (!selectedLayoutId) return;

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
          seating_chart_id: selectedLayoutId,
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
          seating_chart_id: selectedLayoutId,
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
    if (!selectedLayoutId) return;

    try {
      const supabase = createClient();
      
      // Get the max sort_order to place new groups at the end
      const maxSortOrder = groups.length > 0 
        ? Math.max(...groups.map(g => g.sort_order))
        : -1;

      // Grid layout configuration: 3 columns per row (as shown in image)
      const groupsPerRow = 3;
      // Calculate group width based on 2-column groups (default)
      const baseWidthFor2Columns = 400;
      const padding = 8;
      const gap = 8;
      const cardMinWidth = 180;
      const cardWidthFor2Columns = Math.max(cardMinWidth, (baseWidthFor2Columns - (padding * 2) - (gap * (2 - 1))) / 2);
      const groupWidth = Math.max(300, (cardWidthFor2Columns * 2) + (gap * (2 - 1)) + (padding * 2));
      const groupHeight = 150; // Approximate group height (will vary based on content)
      const horizontalSpacing = 30; // Space between groups horizontally
      const verticalSpacing = 30; // Space between rows
      const startX = 50; // Starting X position
      const startY = 50; // Starting Y position

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
      const groupsToCreate: GroupToCreate[] = [];
      for (let i = 0; i < numGroups; i++) {
        const row = Math.floor(i / groupsPerRow);
        const col = i % groupsPerRow;
        
        const x = startX + col * (groupWidth + horizontalSpacing);
        const y = startY + row * (groupHeight + verticalSpacing);
        
        groupsToCreate.push({
          name: `Group ${i + 1}`,
          seating_chart_id: selectedLayoutId,
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
  }, [selectedLayoutId, groups, fetchGroups]);

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
        setSelectedLayoutId(data.id);
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
    const clampedX = Math.max(0, Math.min(relativeX, containerRect.width - 300)); // 300px minimum group width (updated to match new sizing)
    const clampedY = Math.max(0, Math.min(relativeY, containerRect.height - 100)); // 100px minimum group height
    
    // Update the position immediately - free positioning, no snapping
    setGroupPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedGroupId, { x: clampedX, y: clampedY });
      return newPositions;
    });
    
    // Save position to database
    const savePositionToDatabase = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('seating_groups')
          .update({
            position_x: clampedX,
            position_y: clampedY,
          })
          .eq('id', draggedGroupId);
        
        if (error) {
          console.error('Error saving group position:', error);
        }
      } catch (err) {
        console.error('Unexpected error saving group position:', err);
      }
    };
    
    savePositionToDatabase();
    setDraggedGroupId(null);
    dragOffsetRef.current = null; // Clear drag offset
  };

  const moveStudentToGroup = async (studentId: string, fromGroupId: string, toGroupId: string) => {
    // If moving to the same group, do nothing
    if (fromGroupId === toGroupId) {
      setSelectedStudentForSwap(null);
      return;
    }

    try {
      const supabase = createClient();
      
      // Get the student data from the current group
      const studentsInSourceGroup = groupStudents.get(fromGroupId) || [];
      const studentToMove = studentsInSourceGroup.find(s => s.id === studentId);

      if (!studentToMove) {
        console.error('Student not found in source group');
        alert('Failed to move student. The student data may be out of sync.');
        setSelectedStudentForSwap(null);
        return;
      }

      // Get current assignment to verify it exists
      const { data: assignmentArray, error: assignmentError } = await supabase
        .from('student_seat_assignments')
        .select('id')
        .eq('student_id', studentId)
        .eq('seating_group_id', fromGroupId);

      if (assignmentError) {
        console.error('Error finding assignment:', assignmentError);
        alert('Failed to move student. Please try again.');
        setSelectedStudentForSwap(null);
        return;
      }

      const assignmentData = assignmentArray && assignmentArray.length > 0 ? assignmentArray[0] : null;

      // If assignment doesn't exist but student is in local state, create it first
      // This handles cases where there might be a sync issue
      if (!assignmentData) {
        console.warn('Assignment not found in database, but student is in local state. Creating assignment first.');
        // Create the assignment first
        const { data: newAssignment, error: createError } = await supabase
          .from('student_seat_assignments')
          .insert({
            student_id: studentId,
            seating_group_id: fromGroupId,
          })
          .select('id')
          .single();

        if (createError || !newAssignment) {
          console.error('Error creating assignment:', createError);
          alert('Failed to move student. Could not create assignment.');
          setSelectedStudentForSwap(null);
          return;
        }
        
        // Use the newly created assignment
        const tempAssignmentData = { id: newAssignment.id };
        
        // Continue with the move using the new assignment
        // OPTIMISTIC UPDATE: Update local state FIRST for instant UI response
        let rollbackState: Map<string, Student[]> | null = null;
        
        setGroupStudents(prev => {
          // Save current state for potential rollback
          rollbackState = new Map(prev);
          
          const newMap = new Map(prev);
          const sourceGroupStudents = [...(newMap.get(fromGroupId) || [])];
          const targetGroupStudents = [...(newMap.get(toGroupId) || [])];
          
          // Remove student from source group
          const studentIndex = sourceGroupStudents.findIndex(s => s.id === studentId);
          if (studentIndex !== -1) {
            sourceGroupStudents.splice(studentIndex, 1);
          }
          
          // Add student to target group (at the end)
          targetGroupStudents.push(studentToMove);
          
          newMap.set(fromGroupId, sourceGroupStudents);
          newMap.set(toGroupId, targetGroupStudents);
          
          return newMap;
        });

        // Update database in the background
        try {
          // Delete the assignment we just created (since we're moving to a new group)
          const { error: deleteError } = await supabase
            .from('student_seat_assignments')
            .delete()
            .eq('id', tempAssignmentData.id);

          if (deleteError) {
            console.error('Error deleting assignment:', deleteError);
            // Rollback optimistic update
            if (rollbackState) {
              setGroupStudents(rollbackState);
            }
            alert('Failed to move student. Please try again.');
            setSelectedStudentForSwap(null);
            return;
          }

          // Create new assignment in target group
          const { error: insertError } = await supabase
            .from('student_seat_assignments')
            .insert({
              student_id: studentId,
              seating_group_id: toGroupId,
            });

          if (insertError) {
            console.error('Error moving student:', insertError);
            // Rollback optimistic update
            if (rollbackState) {
              setGroupStudents(rollbackState);
            }
            alert('Failed to move student. Please try again.');
            setSelectedStudentForSwap(null);
            return;
          }

          // Success - clear selection
          setSelectedStudentForSwap(null);
        } catch (err) {
          console.error('Unexpected error during database move:', err);
          // Rollback optimistic update
          if (rollbackState) {
            setGroupStudents(rollbackState);
          }
          alert('An unexpected error occurred. The move has been reverted.');
          setSelectedStudentForSwap(null);
        }
        
        return; // Exit early since we handled the case where assignment didn't exist
      }

      // OPTIMISTIC UPDATE: Update local state FIRST for instant UI response
      let rollbackState: Map<string, Student[]> | null = null;
      
      setGroupStudents(prev => {
        // Save current state for potential rollback
        rollbackState = new Map(prev);
        
        const newMap = new Map(prev);
        const sourceGroupStudents = [...(newMap.get(fromGroupId) || [])];
        const targetGroupStudents = [...(newMap.get(toGroupId) || [])];
        
        // Remove student from source group
        const studentIndex = sourceGroupStudents.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
          sourceGroupStudents.splice(studentIndex, 1);
        }
        
        // Add student to target group (at the end)
        targetGroupStudents.push(studentToMove);
        
        newMap.set(fromGroupId, sourceGroupStudents);
        newMap.set(toGroupId, targetGroupStudents);
        
        return newMap;
      });

      // Update database in the background
      try {
        // Delete old assignment
        const { error: deleteError } = await supabase
          .from('student_seat_assignments')
          .delete()
          .eq('id', assignmentData.id);

        if (deleteError) {
          console.error('Error deleting assignment:', deleteError);
          // Rollback optimistic update
          if (rollbackState) {
            setGroupStudents(rollbackState);
          }
          alert('Failed to move student. Please try again.');
          setSelectedStudentForSwap(null);
          return;
        }

        // Create new assignment
        const { error: insertError } = await supabase
          .from('student_seat_assignments')
          .insert({
            student_id: studentId,
            seating_group_id: toGroupId,
          });

        if (insertError) {
          console.error('Error moving student:', insertError);
          // Rollback optimistic update
          if (rollbackState) {
            setGroupStudents(rollbackState);
          }
          alert('Failed to move student. Please try again.');
          setSelectedStudentForSwap(null);
          return;
        }

        // Success - clear selection
        setSelectedStudentForSwap(null);
      } catch (err) {
        console.error('Unexpected error during database move:', err);
        // Rollback optimistic update
        if (rollbackState) {
          setGroupStudents(rollbackState);
        }
        alert('An unexpected error occurred. The move has been reverted.');
        setSelectedStudentForSwap(null);
      }
    } catch (err) {
      console.error('Unexpected error moving student:', err);
      alert('An unexpected error occurred. Please try again.');
      setSelectedStudentForSwap(null);
    }
  };

  const handleGroupClick = (groupId: string) => {
    // If a student is selected for swap, move it to the clicked group
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

  const handleStudentClick = async (e: React.MouseEvent, studentId: string, groupId: string) => {
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
      await swapStudents(selectedStudentForSwap.studentId, selectedStudentForSwap.groupId, studentId, groupId);
      setSelectedStudentForSwap(null);
    }
  };

  const swapStudents = async (studentId1: string, groupId1: string, studentId2: string, groupId2: string) => {
    try {
      const supabase = createClient();
      
      // If students are in the same group, swap their positions in the local state array
      // This changes their visual order within the group
      if (groupId1 === groupId2) {
        console.log('Students are in the same group - swapping positions in local state');
        
        // Get the current students array for this group
        const currentStudents = groupStudents.get(groupId1) || [];
        const student1Index = currentStudents.findIndex(s => s.id === studentId1);
        const student2Index = currentStudents.findIndex(s => s.id === studentId2);
        
        if (student1Index === -1 || student2Index === -1) {
          console.error('One or both students not found in group');
          return;
        }
        
        // Swap the students in the array
        const newStudents = [...currentStudents];
        [newStudents[student1Index], newStudents[student2Index]] = [newStudents[student2Index], newStudents[student1Index]];
        
        // Update local state
        setGroupStudents(prev => {
          const newMap = new Map(prev);
          newMap.set(groupId1, newStudents);
          return newMap;
        });
        
        console.log('Same-group swap completed in local state');
        return;
      }

      // Verify students are actually in these groups in our local state
      const studentsInGroup1 = groupStudents.get(groupId1) || [];
      const studentsInGroup2 = groupStudents.get(groupId2) || [];
      const student1Exists = studentsInGroup1.some(s => s.id === studentId1);
      const student2Exists = studentsInGroup2.some(s => s.id === studentId2);

      if (!student1Exists || !student2Exists) {
        console.error('Students not found in expected groups:', { 
          student1Exists, 
          student2Exists,
          studentId1,
          studentId2,
          groupId1,
          groupId2,
          studentsInGroup1: studentsInGroup1.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}` })),
          studentsInGroup2: studentsInGroup2.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }))
        });
        alert('Failed to swap students. The student data may be out of sync. Please refresh the page and try again.');
        // Refresh groups to sync state
        await fetchGroups();
        return;
      }

      // Different groups - swap ONLY these two students' assignments
      // All other students remain in their exact positions
      
      // First, get current assignments to verify they exist
      // Query without maybeSingle to get array and check length
      const { data: assignment1Array, error: error1 } = await supabase
        .from('student_seat_assignments')
        .select('id')
        .eq('student_id', studentId1)
        .eq('seating_group_id', groupId1);

      const { data: assignment2Array, error: error2 } = await supabase
        .from('student_seat_assignments')
        .select('id')
        .eq('student_id', studentId2)
        .eq('seating_group_id', groupId2);

      const assignment1Data = assignment1Array && assignment1Array.length > 0 ? assignment1Array[0] : null;
      const assignment2Data = assignment2Array && assignment2Array.length > 0 ? assignment2Array[0] : null;

      if (error1 || error2) {
        console.error('Error finding assignments:', { error1, error2, studentId1, groupId1, studentId2, groupId2 });
        alert('Failed to swap students. Please try again.');
        return;
      }

      if (!assignment1Data || !assignment2Data) {
        console.error('One or both assignments not found:', { 
          assignment1Data, 
          assignment2Data, 
          studentId1, 
          groupId1, 
          studentId2, 
          groupId2 
        });
        alert('Failed to swap students. One or both students may not be assigned to their groups.');
        return;
      }

      // OPTIMISTIC UPDATE: Update local state FIRST for instant UI response
      // Then update database in the background
      let rollbackState: Map<string, Student[]> | null = null;
      
      setGroupStudents(prev => {
        // Save current state for potential rollback
        rollbackState = new Map(prev);
        
        const newMap = new Map(prev);
        const studentsInGroup1 = [...(newMap.get(groupId1) || [])];
        const studentsInGroup2 = [...(newMap.get(groupId2) || [])];
        
        // Find and remove student1 from group1
        const student1Index = studentsInGroup1.findIndex(s => s.id === studentId1);
        const student1 = student1Index !== -1 ? studentsInGroup1[student1Index] : null;
        if (student1) {
          studentsInGroup1.splice(student1Index, 1);
        }
        
        // Find and remove student2 from group2
        const student2Index = studentsInGroup2.findIndex(s => s.id === studentId2);
        const student2 = student2Index !== -1 ? studentsInGroup2[student2Index] : null;
        if (student2) {
          studentsInGroup2.splice(student2Index, 1);
        }
        
        // Add student1 to group2 and student2 to group1 (maintaining their relative positions)
        if (student1) {
          // Insert student1 at the same position student2 was (or at the end)
          if (student2Index !== -1 && student2Index < studentsInGroup2.length) {
            studentsInGroup2.splice(student2Index, 0, student1);
          } else {
            studentsInGroup2.push(student1);
          }
        }
        
        if (student2) {
          // Insert student2 at the same position student1 was (or at the end)
          if (student1Index !== -1 && student1Index < studentsInGroup1.length) {
            studentsInGroup1.splice(student1Index, 0, student2);
          } else {
            studentsInGroup1.push(student2);
          }
        }
        
        newMap.set(groupId1, studentsInGroup1);
        newMap.set(groupId2, studentsInGroup2);
        
        return newMap;
      });

      // Update database in the background (non-blocking)
      // If this fails, we'll rollback the optimistic update
      try {
        // Delete ONLY the two specific assignments (by their unique IDs)
        const { error: deleteError1 } = await supabase
          .from('student_seat_assignments')
          .delete()
          .eq('id', assignment1Data.id);

        const { error: deleteError2 } = await supabase
          .from('student_seat_assignments')
          .delete()
          .eq('id', assignment2Data.id);

        if (deleteError1 || deleteError2) {
          console.error('Error deleting assignments:', deleteError1 || deleteError2);
          // Rollback optimistic update
          if (rollbackState) {
            setGroupStudents(rollbackState);
          }
          alert('Failed to swap students. Please try again.');
          return;
        }

        // Create ONLY two new assignments with swapped group IDs
        const { error: insertError } = await supabase
          .from('student_seat_assignments')
          .insert([
            { student_id: studentId1, seating_group_id: groupId2 },
            { student_id: studentId2, seating_group_id: groupId1 },
          ]);

        if (insertError) {
          console.error('Error swapping students:', insertError);
          // Rollback optimistic update
          if (rollbackState) {
            setGroupStudents(rollbackState);
          }
          alert('Failed to swap students. Please try again.');
          return;
        }
        
        // Note: group_rows is calculated on the fly for responsiveness
        // Database will be updated when user clicks "Save Changes" button
      } catch (err) {
        console.error('Unexpected error during database swap:', err);
        // Rollback optimistic update
        if (rollbackState) {
          setGroupStudents(rollbackState);
        }
        alert('An unexpected error occurred. The swap has been reverted.');
      }
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
      
      // Get current groupStudents value from ref (always latest)
      const currentGroupStudents = groupStudentsRef.current;
      
      // Calculate total students (seated + unseated)
      const totalSeatedStudents = Array.from(currentGroupStudents.values()).reduce(
        (sum, students) => sum + students.length,
        0
      );
      const totalStudents = totalSeatedStudents + unseatedStudents.length;
      
      // Calculate target students per group (allowing ±1 difference)
      const targetPerGroup = Math.floor(totalStudents / groups.length);
      const remainder = totalStudents % groups.length;
      
      // Calculate how many students each group currently has
      const groupCurrentCounts = groups.map(group => ({
        groupId: group.id,
        currentCount: currentGroupStudents.get(group.id)?.length || 0
      }));
      
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
      
      // Shuffle unseated students randomly
      const shuffledStudents = [...unseatedStudents].sort(() => Math.random() - 0.5);
      
      // Distribute unseated students to fill groups up to their target size
      const assignments: Array<{ student_id: string; seating_group_id: string }> = [];
      let studentIndex = 0;
      
      // Sort groups by how many students they need (most needed first)
      const sortedGroupNeeds = [...groupNeeds].sort((a, b) => b.needed - a.needed);
      
      for (const groupNeed of sortedGroupNeeds) {
        // Assign students to this group until it reaches its target
        for (let i = 0; i < groupNeed.needed && studentIndex < shuffledStudents.length; i++) {
          assignments.push({
            student_id: shuffledStudents[studentIndex].id,
            seating_group_id: groupNeed.groupId,
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

      // Update local state
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

      // Update local state - move all students back to unseated
      const studentsToUnseat = groupStudents.get(teamToClear.id) || [];
      setGroupStudents(prev => {
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

      // Update local state - move students back to unseated
      const studentsToUnseat = groupStudents.get(teamToDelete.id) || [];
      setGroupStudents(prev => {
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
    if (!selectedLayoutId) {
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

      // Collect all students from all groups to add back to unseated
      const allStudentsToUnseat: Student[] = [];
      groupStudents.forEach((students) => {
        allStudentsToUnseat.push(...students);
      });

      // Clear all groups in local state
      setGroupStudents(prev => {
        const newMap = new Map(prev);
        groupIds.forEach(groupId => {
          newMap.set(groupId, []);
        });
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
    if (!selectedLayoutId) {
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

      // Collect all students from all groups to add back to unseated
      const allStudentsToUnseat: Student[] = [];
      groupStudents.forEach((students) => {
        allStudentsToUnseat.push(...students);
      });

      // Clear all local state
      setGroups([]);
      setGroupStudents(new Map());
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
    <div 
      className="flex flex-row bg-red-600 font-spartan relative w-full h-screen" 
      style={{ 
        height: '100vh',
        width: '100vw',
        position: 'fixed',
            top: 0, 
        left: 0
      }}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors z-50 shadow-lg"
      >
        <svg
          className="w-8 h-8 text-black"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Main Content Area - Add left padding to account for left sidebar (w-76 = 304px) + spacing (8px) */}
      {/* Note: Removed overflow-y-auto from this container to avoid nested scroll container warning with drag-and-drop */}
      <div ref={mainContentRef} className="flex-1 p-1 bg-[#4A3B8D] sm:p-11md:p-2 relative" style={{ paddingLeft: '312px', minHeight: '100%', overflow: 'visible' }}>
        <div className="space-y-8 relative" style={{ zIndex: 1 }}>

        {/* Seating Groups Canvas */}
        <div className="flex-1 flex flex-col relative" style={{ minHeight: 'calc(100vh - 300px)' }}>
          {/* Canvas for groups display */}
          <div 
            className="bg-[#fcf1f0] fixed border-2 border-black rounded-lg pt-2"
            style={{
              top: '6px', // Start at the top of the screen
              left: `${canvasLeft}px`, // Dynamically calculated from left sidebar right edge + spacing
              right: '8px', // Small padding from right edge
              bottom: '85px', // Always extend to bottom nav (80px height) - this ensures it reaches the nav regardless of zoom
              overflow: 'auto',
              zIndex: 1, // Lower than sidebar (z-40) so sidebar appears on top
              width: 'auto', // Width is constrained by left and right
              height: 'auto', // Height is constrained by top and bottom
              maxWidth: '100%', // Prevent overflow
              maxHeight: '100%' // Prevent overflow
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
          {/* Visual Objects - Whiteboard and TV, Teacher's Desk, and Doors */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
            {/* Whiteboard and TV - Centered at top (always visible) */}
            <div
              className="absolute bg-white border-2 border-gray-400 rounded-lg flex items-center justify-center"
              style={{
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '800px',
                height: '30px',
                zIndex: 0
              }}
            >
              <span className="text-gray-700 font-semibold text-lg">Whiteboard and TV</span>
            </div>
            
            {/* Furniture (Teacher's Desk and Doors) - Only show if showObjects is true */}
            {showObjects && (
              <>
                {/* Teacher's Desk - Position based on layoutOrientation */}
                <div
                  className="absolute bg-white border-2 border-gray-400 rounded-lg flex items-center justify-center"
                  style={{
                    top: '55px',
                    ...(layoutOrientation === 'Left' 
                      ? { left: '5px' }
                      : { right: '5px' }
                    ),
                    width: '200px',
                    height: '75px',
                    zIndex: 0
                  }}
                >
                  <span className="text-white font-semibold">Teacher's Desk</span>
            </div>
                
                {/* Door 1 - Top - Position based on layoutOrientation */}
                <div
                  className="absolute bg-gray-700 border-2 border-gray-800 rounded-lg flex items-center justify-center"
                  style={{
                    top: '20%',
                    ...(layoutOrientation === 'Left' 
                      ? { right: '5px' }
                      : { left: '5px' }
                    ),
                    transform: 'translateY(-50%)',
                    width: '30px',
                    height: '100px',
                    zIndex: 0
                  }}
                >
                  <span className="text-white font-semibold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>DOOR</span>
                </div>
                
                {/* Door 2 - Bottom - Position based on layoutOrientation */}
                <div
                  className="absolute bg-gray-700 border-2 border-gray-800 rounded-lg flex items-center justify-center"
                    style={{
                    top: '70%',
                    ...(layoutOrientation === 'Left' 
                      ? { right: '5px' }
                      : { left: '5px' }
                    ),
                    transform: 'translateY(-50%)',
                    width: '30px',
                    height: '100px',
                    zIndex: 0
                  }}
                >
                  <span className="text-white font-semibold" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>DOOR</span>
                </div>
              </>
            )}
          </div>
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
                      const studentsInGroupRaw = groupStudents.get(group.id) || [];
                      // Filter out duplicates by student ID to prevent React key errors
                      const studentsInGroup = studentsInGroupRaw.filter((student, idx, self) => 
                        self.findIndex(s => s.id === student.id) === idx
                      );
                      const isTarget = selectedStudentForGroup && targetGroupId === group.id;
                      // Use group_columns from database (stored value)
                      // Clamp to valid range (1-3) - this is the internal columns for student cards
                      const validColumns = Math.max(1, Math.min(3, group.group_columns || 2));
                      
                      // Get the stored pixel position for this group
                      const position = groupPositions.get(group.id) || { x: 20 + (index * 20), y: 20 + (index * 100) };
                      const groupX = position.x;
                      const groupY = position.y;
                      
                      // Calculate number of rows needed dynamically (on the fly) for responsiveness
                      // Default: at least 2 rows (1 header + 1 student row)
                      // Add more rows only when students exceed the capacity of existing rows
                      const studentsPerRow = validColumns;
                      // Calculate how many student rows are needed based on actual student count
                      // Always have at least 1 student row (even if empty)
                      const studentRowCount = studentsInGroup.length === 0 
                        ? 1  // Empty group: 1 student row
                        : Math.ceil(studentsInGroup.length / studentsPerRow); // Calculate based on student count
                      
                      // Calculate group dimensions based on content
                      const headerHeight = 50; // Header is always 50px
                      const studentRowHeight = 50; // Each student row is 50px
                      const padding = 8; // Internal padding
                      const gap = 8; // Gap between student cards
                      
                      // Calculate width: based on number of columns and card width
                      // First, calculate the 2-column group width as the base reference
                      const baseWidthFor2Columns = 400; // Base width for 2-column groups
                      const cardMinWidth = 180; // Minimum card width (increased to accommodate names and points)
                      
                      // Calculate 2-column group width
                      const cardWidthFor2Columns = Math.max(cardMinWidth, (baseWidthFor2Columns - (padding * 2) - (gap * (2 - 1))) / 2);
                      const twoColumnGroupWidth = Math.max(300, (cardWidthFor2Columns * 2) + (gap * (2 - 1)) + (padding * 2));
                      
                      // Calculate width based on column count
                      let groupWidth: number;
                      if (validColumns === 1) {
                        // 1-column groups are 50% of 2-column groups
                        groupWidth = twoColumnGroupWidth * 0.5;
                      } else if (validColumns === 2) {
                        // 2-column groups use the calculated width
                        groupWidth = twoColumnGroupWidth;
                      } else {
                        // 3-column groups: proportional calculation
                        const cardWidth = Math.max(cardMinWidth, (baseWidthFor2Columns - (padding * 2) - (gap * (validColumns - 1))) / validColumns);
                        groupWidth = Math.max(300, (cardWidth * validColumns) + (gap * (validColumns - 1)) + (padding * 2));
                      }
                      
                      // Calculate height: header + student rows
                      const groupHeight = headerHeight + (studentRowCount * studentRowHeight) + (padding * 2);
                      
                      // Distribute students across rows dynamically
                      const studentRows: Student[][] = [];
                      for (let i = 0; i < studentRowCount; i++) {
                        const startIndex = i * studentsPerRow;
                        const endIndex = startIndex + studentsPerRow;
                        studentRows.push(studentsInGroup.slice(startIndex, endIndex));
                      }
                      
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
                            className={`flex items-center justify-between gap-1 p-1.5 rounded border transition-colors ${
                              isRandomizing ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${bgColor}`}
                            style={{ 
                              width: '100%',
                              minHeight: '32px',
                              height: 'auto'
                            }}
                          >
                            <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-between gap-2">
                              <p 
                                className="font-medium text-gray-800 truncate"
                                style={{
                                  fontSize: 'clamp(0.875rem, 120%, 1.5rem)', // Fixed font size for all groups (same as 1-column groups)
                                  lineHeight: '1.2'
                                }}
                              >
                                {student.first_name} {student.last_name}
                              </p>
                              <span className="text-red-600 font-semibold flex-shrink-0" style={{
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
                                        <svg
                                          className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
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
                                  <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
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

                                {/* Dynamic Student Rows */}
                                {studentRows.map((rowStudents, rowIndex) => (
                                  <div 
                                    key={`${group.id}-row-${rowIndex}`}
                                    onClick={() => handleGroupClick(group.id)}
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: `repeat(${validColumns}, 1fr)`,
                                      gap: '0.5rem',
                                      padding: '0 0.5rem', // Reduced padding to fit within 50px
                                      backgroundColor: '#f9fafb',
                                      cursor: (selectedStudentForGroup || isTargetForMove) ? 'pointer' : 'default',
                                      height: '50px',
                                      minHeight: '50px',
                                      maxHeight: '50px',
                                      overflow: 'hidden',
                                      boxSizing: 'border-box',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {rowStudents.length === 0 ? (
                                      <div className="col-span-full text-gray-500 text-sm text-center py-2" style={{ gridColumn: `1 / ${validColumns + 1}` }}>
                                    {selectedStudentForGroup ? 'Click to add student' : 'No students yet'}
                                  </div>
                                ) : (
                                      <>
                                        {rowStudents.map(student => renderStudentCard(student))}
                                        {/* Fill empty slots in the row if needed */}
                                        {Array.from({ length: validColumns - rowStudents.length }).map((_, emptyIndex) => (
                                          <div key={`empty-${emptyIndex}`} style={{ minHeight: '32px' }} />
                                        ))}
                                      </>
                                )}
                              </div>
                                ))}
                            </div>
                      );
                    })}
                  </div>
          )}
          </div>
        </div>
        </div>
      </div>

      {/* Left Sidebar - Unseated Students - Full height without top/bottom navs */}
      <div 
        ref={leftSidebarRef}
        className="fixed w-76 bg-white flex flex-col overflow-y-auto z-40" 
        style={{ 
          left: '8px',
          top: '8px', // Small padding from top
          bottom: '8px', // Small padding from bottom
          height: 'calc(100vh - 16px)' // Full viewport minus small padding
        }}
      >
        <LeftNavSeatingChartEdit />
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

