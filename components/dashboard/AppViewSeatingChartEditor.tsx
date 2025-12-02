'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';
import AddGroupModal from '@/components/modals/AddGroupModal';
import EditGroupModal from '@/components/modals/EditGroupModal';
import LeftNavSeatingChart from '@/components/dashboard/navbars/LeftNavSeatingChart';

interface SeatingChart {
  id: string;
  name: string;
  class_id: string;
  created_at: string;
}

interface SeatingGroup {
  id: string;
  name: string;
  seating_chart_id: string;
  sort_order: number;
  group_columns: number; // Number of columns for the group (renamed from grid_columns)
  group_rows?: number;  // Number of rows for the group (1 header + student rows, min 2)
  grid_column?: number; // Column position on the pink canvas (1-indexed)
  grid_row?: number;    // Row position on the pink canvas (1-indexed)
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
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SeatingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SeatingGroup | null>(null);
  const [groupStudents, setGroupStudents] = useState<Map<string, Student[]>>(new Map());
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [openSettingsMenuId, setOpenSettingsMenuId] = useState<string | null>(null);
  const [selectedStudentForSwap, setSelectedStudentForSwap] = useState<{ studentId: string; groupId: string } | null>(null);
  const [gridColumns, setGridColumns] = useState(6); // Number of columns in the grid (default: 6)
  // Store grid positions for each group (column and row)
  const [groupPositions, setGroupPositions] = useState<Map<string, { column: number; row: number }>>(new Map());
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  // Track which group is being dragged
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);

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
        
        // Initialize grid positions for groups from database or default
        setGroupPositions(prev => {
          const newPositions = new Map(prev);
          groupsData.forEach((group, index) => {
            // Use saved position from database if available, otherwise default
            if (group.grid_column && group.grid_row) {
              newPositions.set(group.id, { 
                column: group.grid_column, 
                row: group.grid_row 
              });
            } else if (!newPositions.has(group.id)) {
              // Default to col-1, row based on index
              newPositions.set(group.id, { column: 1, row: index + 1 });
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
      setGroupStudents(prev => {
        const newMap = new Map(prev);
        const groupStudentsList = newMap.get(groupId) || [];
        const removedStudent = groupStudentsList.find(s => s.id === studentId);
        
        if (removedStudent) {
          newMap.set(groupId, groupStudentsList.filter(s => s.id !== studentId));
          // Add back to unseated list (check for duplicates first)
          setUnseatedStudents((prev: Student[]) => {
            // Check if student is already in the list
            if (!prev.find(s => s.id === removedStudent.id)) {
              return [...prev, removedStudent];
            }
            return prev;
          });
        }
        return newMap;
      });
      
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

      // Calculate initial position (column 1, next available row)
      // Find the highest row number from existing groups
      let maxRow = 0;
      groupPositions.forEach(pos => {
        if (pos.row > maxRow) maxRow = pos.row;
      });
      // Also check groups that might have positions in database but not in state yet
      groups.forEach(group => {
        if (group.grid_row && group.grid_row > maxRow) {
          maxRow = group.grid_row;
        }
      });
      const initialColumn = 1;
      const initialRow = maxRow + 1;

      // Insert group with all parameters in a single operation
      // Note: group_rows is calculated dynamically and saved on "Save Changes", so we don't include it here
      const { data, error: insertError } = await supabase
        .from('seating_groups')
        .insert({
          name: groupName,
          seating_chart_id: selectedLayoutId,
          sort_order: maxSortOrder + 1,
          group_columns: columns,
          grid_column: initialColumn,
          grid_row: initialRow,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating seating group:', insertError);
        alert('Failed to create group. Please try again.');
        return;
      }

      if (data) {
        // Update local state with the new group position
        setGroupPositions(prev => {
          const newPositions = new Map(prev);
          newPositions.set(data.id, { column: initialColumn, row: initialRow });
          return newPositions;
        });
        
        // Refresh groups to get the latest data
        await fetchGroups();
        setIsAddGroupModalOpen(false);
      }
    } catch (err) {
      console.error('Unexpected error creating seating group:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleCreateLayout = async (layoutName: string) => {
    try {
      const supabase = createClient();
      
      const { data, error: insertError } = await supabase
        .from('seating_charts')
        .insert({
          name: layoutName,
          class_id: classId,
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
    setDraggedGroupId(groupId);
    // Set drag image to be the element itself
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', groupId);
    
    // Make the drag image semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedGroupId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!gridContainerRef.current || !draggedGroupId) {
      return;
    }

    const container = gridContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Get drop coordinates relative to the grid container
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    
    // Account for gap between grid items (gap-4 = 1rem = 16px)
    const gap = 16;
    const totalGapWidth = gap * (gridColumns - 1);
    const cellWidth = (containerRect.width - totalGapWidth) / gridColumns;
    
    // Calculate which column (1-indexed) based on drop X position
    let column = 1;
    for (let i = 0; i < gridColumns; i++) {
      const columnStart = i * (cellWidth + gap);
      const columnEnd = columnStart + cellWidth;
      if (relativeX >= columnStart && relativeX <= columnEnd) {
        column = i + 1;
        break;
      }
    }
    column = Math.max(1, Math.min(gridColumns, column));
    
    // Calculate which grid row (1-9) based on Y position
    const rowHeight = 50;
    const rowGap = 16;
    
    let row = 1;
    for (let i = 0; i < 9; i++) {
      const rowStart = i * rowHeight + i * rowGap;
      const rowEnd = rowStart + rowHeight;
      if (relativeY >= rowStart && relativeY <= rowEnd) {
        row = i + 1;
        break;
      }
    }
    if (relativeY > 8 * rowHeight + 8 * rowGap + rowHeight) {
      row = 9;
    }
    row = Math.max(1, Math.min(9, row));
    
    // Update the position immediately - no animations, no jumping
    setGroupPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedGroupId, { column, row });
      return newPositions;
    });
    
    // Save position to database
    const savePositionToDatabase = async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('seating_groups')
          .update({
            grid_column: column,
            grid_row: row,
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
  };

  const handleGroupClick = (groupId: string) => {
    // Don't handle group click if a student is selected for swapping
    if (selectedStudentForSwap) {
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

  const handleAssignSeats = async () => {
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
      
      // Calculate total students (seated + unseated)
      const totalSeatedStudents = Array.from(groupStudents.values()).reduce(
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
        currentCount: groupStudents.get(group.id)?.length || 0
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
  };


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

  const handleClearTeam = async (groupId: string) => {
    if (!confirm('Are you sure you want to clear all students from this team?')) {
      return;
    }

    try {
      const supabase = createClient();
      
      // Delete all student assignments for this group
      const { error: deleteError } = await supabase
        .from('student_seat_assignments')
        .delete()
        .eq('seating_group_id', groupId);

      if (deleteError) {
        console.error('Error clearing team:', deleteError);
        alert('Failed to clear team. Please try again.');
        return;
      }

      // Update local state - move all students back to unseated
      const studentsToUnseat = groupStudents.get(groupId) || [];
      setGroupStudents(prev => {
        const newMap = new Map(prev);
        newMap.set(groupId, []);
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
      
      setOpenSettingsMenuId(null);
    } catch (err) {
      console.error('Unexpected error clearing team:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleDeleteTeam = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      
      // First, delete all student assignments for this group
      await supabase
        .from('student_seat_assignments')
        .delete()
        .eq('seating_group_id', groupId);

      // Then delete the group itself
      const { error: deleteError } = await supabase
        .from('seating_groups')
        .delete()
        .eq('id', groupId);

      if (deleteError) {
        console.error('Error deleting team:', deleteError);
        alert('Failed to delete team. Please try again.');
        return;
      }

      // Update local state - move students back to unseated
      const studentsToUnseat = groupStudents.get(groupId) || [];
      setGroupStudents(prev => {
        const newMap = new Map(prev);
        newMap.delete(groupId);
        return newMap;
      });
      
      setGroups(prev => prev.filter(g => g.id !== groupId));
      // Add students back to unseated list (filter out duplicates)
      setUnseatedStudents((prev: Student[]) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newStudents = studentsToUnseat.filter(s => !existingIds.has(s.id));
        return [...prev, ...newStudents];
      });
      setOpenSettingsMenuId(null);
    } catch (err) {
      console.error('Unexpected error deleting team:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

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
      className="flex flex-row bg-red-600 font-spartan relative w-full" 
      style={{ 
        minHeight: 'calc(100vh - 200px)', // Full viewport minus top nav (120px) and bottom nav (80px)
        height: '100%'
      }}
    >
      {/* Main Content Area - Add right padding to account for right sidebar (w-76 = 304px) + spacing (8px) */}
      {/* Note: Removed overflow-y-auto from this container to avoid nested scroll container warning with drag-and-drop */}
      <div className="flex-1 p-1 bg-red-500 sm:p-11md:p-2 relative" style={{ paddingRight: '312px', minHeight: '100%', overflow: 'visible' }}>
        <div className="space-y-8 relative" style={{ zIndex: 1 }}>
        {/* Layout Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-white font-semibold text-lg whitespace-nowrap">
            Editing Layout:
          </label>
          <select
            value={selectedLayoutId || ''}
            onChange={(e) => setSelectedLayoutId(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
          >
            {layouts.map((layout) => (
              <option key={layout.id} value={layout.id}>
                {layout.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
          >
            Create New Layout
          </button>
        </div>

        {/* Seating Groups Canvas */}
        <div className="mt-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-semibold">
              Seating Groups {selectedStudentForGroup && (
                <span className="text-sm font-normal text-purple-200">
                  - Click a group to add &quot;{selectedStudentForGroup.first_name} {selectedStudentForGroup.last_name}&quot;
                </span>
              )}
            </h3>
            <div className="flex items-center gap-6">
              {/* Columns Radio Buttons */}
              <div className="flex items-center gap-3">
                <label className="text-white font-semibold text-sm">Columns:</label>
                <div className="flex items-center gap-3">
                  {[2, 4, 6, 8].map((cols) => (
                    <label
                      key={cols}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="gridColumns"
                        value={cols}
                        checked={gridColumns === cols}
                        onChange={(e) => setGridColumns(Number(e.target.value))}
                        className="w-4 h-4 text-purple-600 bg-white border-gray-300 focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="text-white text-sm">{cols}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleAssignSeats}
                className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
              >
                Auto Assign Seats
              </button>
              <button
                onClick={() => setIsAddGroupModalOpen(true)}
                className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors"
              >
                Add New Group
              </button>
            </div>
          </div>

          {/* Canvas for groups display */}
          <div 
            className="bg-pink-500 w-full relative"
            style={{
              height: '578px', // Fixed height: 9 rows × 50px + 8 gaps × 16px = 450px + 128px
              minHeight: '578px',
              maxHeight: '578px',
              overflow: 'hidden'
            }}
          >
            {/* Grid lines - vertical and horizontal to create Excel-like grid */}
            <div 
              className="absolute pointer-events-none inset-0"
              style={{ 
                zIndex: 0
              }}
            >
              {/* Vertical grid lines */}
              {Array.from({ length: gridColumns + 1 }).map((_, index) => {
                const leftPercent = (index / gridColumns) * 100;
                return (
                  <div
                    key={`v-${index}`}
                    className="absolute bg-gray-400"
                    style={{
                      left: `${leftPercent}%`,
                      width: '1px',
                      top: 0,
                      bottom: 0,
                      height: '100%',
                      opacity: 0.3
                    }}
                  />
                );
              })}
              
              {/* Horizontal grid lines - exactly 10 lines (9 row boundaries + 1 bottom) */}
              {/* Grid lines should align with row boundaries: 0, 50, 66, 116, 132, 182, etc. */}
              {Array.from({ length: 10 }).map((_, index) => {
                // Grid line positions: each row is 50px, gap is 16px between rows
                // Line 0: 0px (top)
                // Line 1: 50px (end of row 1)
                // Line 2: 66px (50 + 16, start of row 2)
                // Line 3: 116px (50 + 16 + 50, end of row 2)
                // Formula: index * 50px + (index > 0 ? (index - 1) * 16px : 0)
                const rowHeight = 50;
                const gap = 16;
                const topPosition = index === 0 
                  ? 0 
                  : index * rowHeight + (index - 1) * gap;
                
                return (
                  <div
                    key={`h-${index}`}
                    className="absolute bg-gray-400"
                    style={{
                      top: `${topPosition}px`,
                      left: 0,
                      right: 0,
                      width: '100%',
                      height: '1px',
                      opacity: 0.3,
                      zIndex: 0
                    }}
                  />
                );
              })}
            </div>
          {isLoadingGroups ? (
            <div className="flex items-center justify-center p-8 relative" style={{ zIndex: 1 }}>
              <p className="text-white/80">Loading groups...</p>
            </div>
          ) : groups.length > 0 && (
            <div
              ref={gridContainerRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="grid gap-4 relative"
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                gridTemplateRows: 'repeat(9, 50px)', // Match group row height exactly (50px)
                height: '578px', // 9 rows × 50px + 8 gaps × 16px = 450px + 128px
                zIndex: 1,
                alignContent: 'start' // Align content to start to prevent extra spacing
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
                      // Each group's internal column count directly maps to grid column span
                      // A group with 2 internal columns takes up 2 grid columns, etc.
                      // Clamp to not exceed the total available grid columns
                      const gridColumnSpan = Math.min(validColumns, gridColumns);
                      
                      // Get the stored grid position for this group
                      const position = groupPositions.get(group.id) || { column: 1, row: index + 1 };
                      const gridColumn = position.column;
                      // Use actual grid row directly (1-9), not logical rows
                      const gridRow = position.row;
                      
                      // Calculate number of rows needed dynamically (on the fly) for responsiveness
                      // Default: at least 2 rows (1 header + 1 student row)
                      // Add more rows only when students exceed the capacity of existing rows
                      const studentsPerRow = validColumns;
                      // Calculate how many student rows are needed based on actual student count
                      // Always have at least 1 student row (even if empty)
                      const studentRowCount = studentsInGroup.length === 0 
                        ? 1  // Empty group: 1 student row
                        : Math.ceil(studentsInGroup.length / studentsPerRow); // Calculate based on student count
                      const totalRowCount = Math.max(2, 1 + studentRowCount); // 1 header + student rows (minimum 2)
                      // Ensure group doesn't exceed row 9
                      const maxRow = Math.min(9, gridRow + totalRowCount - 1);
                      const actualRowSpan = maxRow - gridRow + 1;
                      
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
                        return (
                          <div
                            key={student.id}
                            onClick={(e) => handleStudentClick(e, student.id, group.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`flex items-center justify-between gap-1 p-1.5 rounded border cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-yellow-300 border-yellow-500 hover:bg-yellow-400' 
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            style={{ 
                              width: '100%',
                              minHeight: '32px',
                              height: 'auto'
                            }}
                          >
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p 
                                className="font-medium text-gray-800 truncate"
                                style={{
                                  fontSize: `clamp(0.875rem, ${120 / validColumns}%, 1.5rem)`,
                                  lineHeight: '1.2'
                                }}
                              >
                                {student.first_name} {student.last_name}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStudentFromGroup(student.id, group.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-0.5 flex-shrink-0"
                              title="Remove from group"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      };
                      
                      return (
                        <div
                          key={group.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, group.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleGroupClick(group.id)}
                          className={`bg-white rounded-lg border-2 shadow-lg flex flex-col ${
                            draggedGroupId === group.id ? 'shadow-2xl border-purple-600 opacity-50' : 
                            isTarget ? 'border-purple-500 ring-4 ring-purple-300' :
                            selectedStudentForGroup ? 'border-purple-400 hover:border-purple-500 cursor-pointer' :
                            'border-gray-300'
                          }`}
                          style={{
                            position: 'relative',
                            zIndex: draggedGroupId === group.id ? 9999 : 1,
                            boxSizing: 'border-box',
                            gap: 0,
                            // Span dynamic rows and the appropriate columns
                            gridColumn: `${gridColumn} / span ${gridColumnSpan}`,
                            gridRow: `${gridRow} / span ${actualRowSpan}`,
                            width: '100%',
                            maxWidth: '100%',
                            // Height must exactly match grid allocation: rows × 50px + gaps × 16px
                            height: `calc(${actualRowSpan} * 50px + ${actualRowSpan - 1} * 16px)`,
                            minHeight: `calc(${actualRowSpan} * 50px + ${actualRowSpan - 1} * 16px)`,
                            maxHeight: `calc(${actualRowSpan} * 50px + ${actualRowSpan - 1} * 16px)`,
                            overflow: 'hidden',
                            transition: 'none' // No transitions - instant snap
                          }}
                        >
                          {/* Group Header - Row 1 */}
                          <div
                            className="border-b border-gray-200 bg-purple-50 rounded-t-lg cursor-grab active:cursor-grabbing relative"
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
                                {openSettingsMenuId === group.id && (
                                  <div
                                    data-settings-menu
                                    className="absolute top-10 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]"
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

                                  {/* Team Name */}
                                  <div className="pr-8">
                                    <h4 className="font-semibold text-gray-800">{group.name}</h4>
                                  </div>
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
                                      cursor: selectedStudentForGroup ? 'pointer' : 'default',
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

      {/* Right Sidebar - Unseated Students - Positioned to span from top nav to bottom nav with matching spacing */}
      <div 
        className="fixed w-76 bg-white flex flex-col overflow-y-auto z-40" 
        style={{ 
          right: '8px', // Match the pr-2 (8px) padding from main content area, same as left side spacing
          top: '128px', // TopNav height (h-30 = 120px) + main content padding (pt-2 = 8px)
          bottom: '80px', // BottomNav height (h-20 on large screens = 80px)
          height: 'calc(100vh - 208px)' // 100vh - TopNav (120px) - padding (8px) - BottomNav (80px)
        }}
      >
        <LeftNavSeatingChart />
      </div>

      {/* Create Layout Modal */}
      <CreateLayoutModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateLayout={handleCreateLayout}
      />

      {/* Add Group Modal */}
      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
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
    </div>
  );
}

