'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';
import LeftNavSeatingChartView from '@/components/dashboard/navbars/LeftNavSeatingChartView';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import CreateLayoutModal from '@/components/modals/CreateLayoutModal';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import PointsAwardedConfirmationModal from '@/components/modals/PointsAwardedConfirmationModal';

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
  students: Student | null;
}

interface Class {
  id: string;
  name: string;
  icon?: string;
}

interface AppViewSeatingChartProps {
  classId: string;
}

export default function AppViewSeatingChart({ classId }: AppViewSeatingChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [layouts, setLayouts] = useState<SeatingChart[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<SeatingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupStudents, setGroupStudents] = useState<Map<string, Student[]>>(new Map());
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [groupPositions, setGroupPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [layoutToDelete, setLayoutToDelete] = useState<{ id: string; name: string } | null>(null);
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
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const leftSidebarRef = useRef<HTMLDivElement | null>(null);
  const [canvasLeft, setCanvasLeft] = useState(320); // Default left position (8px sidebar left + 304px width + 8px spacing)
  // View settings from database
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showObjects, setShowObjects] = useState<boolean>(true);
  const [layoutOrientation, setLayoutOrientation] = useState<string>('Left');

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

  // Fetch classes for LeftNav
  const fetchClasses = useCallback(async () => {
    try {
      setIsLoadingClasses(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      // Fetch classes for the current teacher based on viewMode
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_archived', viewMode === 'archived')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching classes for sidebar:', error);
        return;
      }

      setClasses(data || []);
    } catch (err) {
      console.error('Unexpected error fetching classes for sidebar:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [viewMode]);

  // Fetch classes on mount and when viewMode changes
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

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
        } else {
          // No groups, all students are unseated
          setGroupStudents(new Map());
        }
      } else {
        setGroups([]);
        setGroupStudents(new Map());
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
      setGroupStudents(new Map());
    }
  }, [selectedLayoutId, fetchGroups, allStudents.length]);

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


  // Handle delete layout
  const handleDeleteLayout = (layoutId: string, layoutName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent button click from selecting the layout
    setLayoutToDelete({ id: layoutId, name: layoutName });
    setIsDeleteModalOpen(true);
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

  // Handle group click to open award points modal
  const handleGroupClick = (groupId: string) => {
    const studentsInGroup = groupStudents.get(groupId) || [];
    if (studentsInGroup.length === 0) {
      alert('This group has no students to award points to.');
      return;
    }
    const studentIds = studentsInGroup.map(student => student.id);
    setSelectedGroupStudentIds(studentIds);
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
      <div className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="text-center">
            <h2 className="text-white text-2xl font-semibold mb-2">No seating charts yet</h2>
            <p className="text-white/80 text-lg">
              Click on Seating Editor View in the bottom navigation to create a new layout.
            </p>
          </div>
        </div>
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
      {/* Main Content Area - Add left padding to account for left sidebar (w-76 = 304px) + spacing (8px) */}
      <div ref={mainContentRef} className="flex-1 p-1 bg-[#4A3B8D] sm:p-11md:p-2 relative" style={{ paddingLeft: '312px', minHeight: '100%', overflow: 'visible' }}>
        <div className="space-y-8 relative" style={{ zIndex: 1 }}>

        {/* Seating Groups Canvas */}
        <div className="flex-1 flex flex-col relative" style={{ minHeight: 'calc(100vh - 300px)' }}>
          {/* Canvas for groups display */}
          <div 
            className="bg-[#fcfcfc] fixed border-2 border-white rounded-lg pt-2"
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
              <span className="text-white font-semibold text-lg">Whiteboard and TV</span>
            </div>
            
            {/* Furniture (Teacher's Desk and Doors) - Only show if showObjects is true */}
            {showObjects && (
              <>
                {/* Teacher's Desk - Position based on layoutOrientation */}
                <div
                  className="absolute bg-gray-700 border-2 border-gray-800 rounded-lg flex items-center justify-center"
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
                      // Use group_columns from database (stored value)
                      // Clamp to valid range (1-3) - this is the internal columns for student cards
                      const validColumns = Math.max(1, Math.min(3, group.group_columns || 2));
                      
                      // Get the stored pixel position for this group
                      const position = groupPositions.get(group.id) || { x: 20 + (index * 20), y: 20 + (index * 100) };
                      const groupX = position.x;
                      const groupY = position.y;
                      
                      // Calculate number of rows needed dynamically
                      const studentsPerRow = validColumns;
                      const studentRowCount = studentsInGroup.length === 0 
                        ? 1  // Empty group: 1 student row
                        : Math.ceil(studentsInGroup.length / studentsPerRow);
                      
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
                      
                      // Render student card component (read-only)
                      const renderStudentCard = (student: Student) => {
                        // Determine background color based on gender
                        let bgColor = 'bg-white border-gray-200';
                        if (student.gender === null || student.gender === undefined || student.gender === '') {
                          bgColor = 'bg-white border-gray-200';
                        } else if (student.gender === 'Boy') {
                          bgColor = 'bg-blue-200 border-blue-300';
                        } else if (student.gender === 'Girl') {
                          bgColor = 'bg-pink-200 border-pink-300';
                        }
                        
                        return (
                          <div
                            key={student.id}
                            className={`flex items-center justify-between gap-1 p-1.5 rounded border ${bgColor}`}
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
                          </div>
                        );
                      };
                      
                      return (
                        <div
                          key={group.id}
                          onClick={() => handleGroupClick(group.id)}
                          className="bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
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
                          {/* Group Header - Row 1 */}
                          <div
                            className="border-b border-gray-200 bg-purple-50 rounded-t-lg"
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
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{group.name}</h4>
                            </div>
                          </div>
                          
                          {/* Dynamic Student Rows */}
                          {studentRows.map((rowStudents, rowIndex) => (
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
                              {rowStudents.length === 0 ? (
                                <div className="col-span-full text-gray-500 text-sm text-center py-2" style={{ gridColumn: `1 / ${validColumns + 1}` }}>
                                  No students
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

      {/* Left Sidebar - Full height without top/bottom navs */}
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
        <LeftNavSeatingChartView 
          onAddLayout={() => setIsCreateModalOpen(true)}
          layouts={layouts}
          selectedLayoutId={selectedLayoutId}
          onSelectLayout={setSelectedLayoutId}
          onDeleteLayout={handleDeleteLayout}
          isLoadingLayouts={isLoading}
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

      {/* Award Points Modal for Group */}
      {selectedGroupStudentIds.length > 0 && (
        <AwardPointsModal
          isOpen={isAwardPointsModalOpen}
          onClose={() => {
            setIsAwardPointsModalOpen(false);
            setSelectedGroupStudentIds([]);
          }}
          student={null}
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
