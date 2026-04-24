'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/client';
import AddStudentsModal from '@/components/modals/AddStudentsModal';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import EditStudentModal from '@/components/modals/EditStudentModal';
import PointsAwardedConfirmationModal from '@/components/modals/PointsAwardedConfirmationModal';
import { Student } from '@/lib/types';
import { useStudentSort } from '@/context/StudentSortContext';
import { normalizeClassIconPath } from '@/lib/iconUtils';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import StudentCardsGrid from './maincontent/viewStudentsGrid/StudentCardsGrid';
import StudentCardsGridMulti from './maincontent/viewStudentsGrid/StudentCardsGridMulti';
import AppViewSeatingChart from './AppViewSeatingChart';
import AppViewSeatingChartEditor from './AppViewSeatingChartEditor';
import CanvasToolbar from '@/components/ui/CanvasToolbar';
import ClassPointLogSlidePanel from '@/components/ui/ClassPointLogSlidePanel';
import IconAddPlus from '@/components/iconsCustom/iconAddPlus';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import IconPresentationBoard from '@/components/iconsCustom/iconPresentationBoard';
import IconDocumentClock from '@/components/iconsCustom/iconDocumentClock';
import { useClassPointLog } from '@/hooks/useClassPointLog';
import { useDashboardToolbarInset } from '@/hooks/useDashboardToolbarInset';

export default function AppViewStudents() {
  const params = useParams();
  const classId = params.classId as string;
  const searchParams = useSearchParams();
  const { sortBy } = useStudentSort();
  
  // Get current view mode from URL
  const currentView = searchParams.get('view') || 'grid';
  // Check if we're in edit mode from URL (this should match layout's isEditMode)
  const isEditModeFromURL = searchParams.get('mode') === 'edit';
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState<string>('');
  const [classIcon, setClassIcon] = useState<string>('/images/dashboard/class-icons/icon-1.png');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isPointsModalOpen, setPointsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isWholeClassModalOpen, setIsWholeClassModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [awardInfo, setAwardInfo] = useState<{
    studentAvatar: string;
    studentFirstName: string;
    points: number;
    categoryName: string;
    categoryIcon?: string;
  } | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isMultiStudentAwardModalOpen, setIsMultiStudentAwardModalOpen] = useState(false);
  const [isSeatingEditMode, setIsSeatingEditMode] = useState(false);
  const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);
  const prevViewRef = useRef<string | null>(null);

  // Dispatch initial state to BottomNav
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('multiSelectStateChanged', { detail: { isMultiSelect: false } }));
  }, []);

  useEffect(() => {
    if (classId) {
      // Clear recently selected data when a new class is selected
      localStorage.removeItem('lastSelectedClasses');
      localStorage.removeItem('lastSelectedStudents');
      // Dispatch event to notify BottomNav
      window.dispatchEvent(new CustomEvent('recentlySelectedCleared'));
      
      fetchClass();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // When switching from Seating Chart to Student Grid, refetch students so the grid shows updated points
  useEffect(() => {
    if (prevViewRef.current === 'seating' && currentView === 'grid' && classId) {
      fetchStudents();
    }
    prevViewRef.current = currentView;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, classId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdownId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-dropdown-container]')) {
        return;
      }
      if (target.closest('[data-student-card]')) {
        setTimeout(() => setOpenDropdownId(null), 0);
        return;
      }
      setOpenDropdownId(null);
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [openDropdownId]);

  // Sync edit mode with URL parameter
  useEffect(() => {
    setIsSeatingEditMode(isEditModeFromURL);
  }, [isEditModeFromURL]);

  // Listen for seating chart edit mode changes (for backwards compatibility)
  useEffect(() => {
    const handleEditModeChange = (event: CustomEvent) => {
      // URL parameter is the source of truth, but we can still listen to events
      // The URL should already be updated by BottomNav
      setIsSeatingEditMode(event.detail.isEditMode || isEditModeFromURL);
    };

    window.addEventListener('seatingChartEditMode', handleEditModeChange as EventListener);
    return () => {
      window.removeEventListener('seatingChartEditMode', handleEditModeChange as EventListener);
    };
  }, [isEditModeFromURL]);

  // Listen for multi-select toggle event from BottomNav
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsMultiSelectMode(prev => {
        const newState = !prev;
        // Dispatch state update event so BottomNav can sync
        window.dispatchEvent(new CustomEvent('multiSelectStateChanged', { detail: { isMultiSelect: newState } }));
        if (newState === false) {
          // Clear selections when exiting multi-select mode
          setSelectedStudentIds([]);
          window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: 0 } }));
        } else {
          // When entering multi-select mode, dispatch initial count (0)
          window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: 0 } }));
        }
        return newState;
      });
    };

    const handleSelectAll = () => {
      if (isMultiSelectMode) {
        // Select all students
        const allIds = students.map(s => s.id);
        setSelectedStudentIds(allIds);
        window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: allIds.length } }));
      }
    };

    const handleSelectNone = () => {
      if (isMultiSelectMode) {
        // Deselect all students
        setSelectedStudentIds([]);
        window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: 0 } }));
      }
    };

    const handleRecentlySelect = () => {
      if (isMultiSelectMode) {
        // Get last selected student IDs from localStorage
        const lastSelected = localStorage.getItem('lastSelectedStudents');
        if (lastSelected) {
          try {
            const ids = JSON.parse(lastSelected);
            setSelectedStudentIds(ids);
            window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: ids.length } }));
          } catch (e) {
            console.error('Error parsing last selected students:', e);
          }
        }
      }
    };

    const handleAwardPoints = () => {
      if (isMultiSelectMode && selectedStudentIds.length > 0) {
        setIsMultiStudentAwardModalOpen(true);
      } else {
        alert('Please select at least one student to award points.');
      }
    };

    const handleInverseSelect = () => {
      if (isMultiSelectMode) {
        // Get all student IDs
        const allStudentIds = students.map(s => s.id);
        // Inverse: select all that are not currently selected
        const newSelectedIds = allStudentIds.filter(id => !selectedStudentIds.includes(id));
        setSelectedStudentIds(newSelectedIds);
        window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: newSelectedIds.length } }));
      }
    };

    window.addEventListener('toggleMultiSelect', handleToggleEvent);
    window.addEventListener('selectAll', handleSelectAll);
    window.addEventListener('selectNone', handleSelectNone);
    window.addEventListener('recentlySelect', handleRecentlySelect);
    window.addEventListener('awardPoints', handleAwardPoints);
    window.addEventListener('inverseSelect', handleInverseSelect);
    
    return () => {
      window.removeEventListener('toggleMultiSelect', handleToggleEvent);
      window.removeEventListener('selectAll', handleSelectAll);
      window.removeEventListener('selectNone', handleSelectNone);
      window.removeEventListener('recentlySelect', handleRecentlySelect);
      window.removeEventListener('awardPoints', handleAwardPoints);
      window.removeEventListener('inverseSelect', handleInverseSelect);
    };
  }, [isMultiSelectMode, students, selectedStudentIds]);

  const fetchClass = async () => {
    try {
      const supabase = createClient();
      
      const { data: classData, error: fetchError } = await supabase
        .from('classes')
        .select('name, icon')
        .eq('id', classId)
        .single();

      if (fetchError) {
        console.error('Error fetching class:', fetchError?.message || fetchError);
        return;
      }

      if (classData) {
        setClassName(classData.name);
        setClassIcon(normalizeClassIconPath(classData.icon));
      }
    } catch (err) {
      console.error('Unexpected error fetching class:', err instanceof Error ? err.message : err);
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();
      
      const { data: students, error: fetchError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          points,
          avatar,
          student_number,
          gender,
          class_id
        `)
        .eq('class_id', classId)
        .order('last_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching students:', fetchError?.message || fetchError);
        setError('Failed to load students. Please try again.');
        return;
      }

      if (students) {
        setStudents(students);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err instanceof Error ? err.message : err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dropdown toggle
  const toggleDropdown = (studentId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === studentId ? null : studentId);
  };

  // Handle edit student
  const handleEditStudent = (studentId: string) => {
    const studentToEdit = students.find(s => s.id === studentId);
    if (studentToEdit) {
      setEditingStudent(studentToEdit);
      setIsEditStudentModalOpen(true);
    }
    setOpenDropdownId(null);
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (error) {
          console.error('Error deleting student:', error);
          alert('Failed to delete student. Please try again.');
          return;
        }

        console.log('Student deleted successfully');
        setOpenDropdownId(null);
        fetchStudents();
      } catch (err) {
        console.error('Unexpected error deleting student:', err);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Handle student card click to open Award Points modal
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
    setPointsModalOpen(true);
  };

  // Handle whole class card click to open Award Points modal
  const handleWholeClassClick = () => {
    setIsWholeClassModalOpen(true);
  };

  // Handle student selection in multi-select mode
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSelection = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
      
      // Dispatch selection count change event for BottomNav
      window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: newSelection.length } }));
      
      return newSelection;
    });
  };

  // Dispatch selection count when selection changes
  useEffect(() => {
    if (isMultiSelectMode) {
      window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: selectedStudentIds.length } }));
    }
  }, [selectedStudentIds, isMultiSelectMode]);

  // Handle award complete - store selected student IDs in localStorage and clear selection
  const handleAwardComplete = (selectedIds: string[], type: 'classes' | 'students') => {
    if (type === 'students') {
      localStorage.setItem('lastSelectedStudents', JSON.stringify(selectedIds));
      // Notify BottomNav that recently selected data is now available
      window.dispatchEvent(new CustomEvent('recentlySelectedUpdated'));
      
      // Clear the selection after awarding points
      setSelectedStudentIds([]);
      window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: 0 } }));
    }
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
  };

  // Sort students based on sortBy option
  // Note: This same sortedStudents array is used for both single view and multi-select view,
  // ensuring the sort order is preserved when switching between views
  const sortedStudents = useMemo(() => {
    const studentsCopy = [...students];
    
    if (sortBy === 'number') {
      return studentsCopy.sort((a, b) => {
        // Handle null student numbers - put them at the end
        if (a.student_number === null && b.student_number === null) return 0;
        if (a.student_number === null) return 1;
        if (b.student_number === null) return -1;
        return a.student_number - b.student_number;
      });
    } else if (sortBy === 'points') {
      // Sort by points (most to least)
      return studentsCopy.sort((a, b) => {
        const pointsA = a.points || 0;
        const pointsB = b.points || 0;
        // Sort descending (most points first)
        if (pointsA !== pointsB) {
          return pointsB - pointsA;
        }
        // If points are equal, sort alphabetically by last name, then first name
        const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
    } else if (sortBy === 'alphabetical') {
      // Alphabetical sort by first name (card display name), then last name
      return studentsCopy.sort((a, b) => {
        const firstNameCompare = (a.first_name || '').localeCompare(b.first_name || '');
        if (firstNameCompare !== 0) return firstNameCompare;
        return (a.last_name || '').localeCompare(b.last_name || '');
      });
    } else {
      return studentsCopy;
    }
  }, [students, sortBy]);

  // Calculate total points for the whole class
  const totalClassPoints = useMemo(() => {
    return students.reduce((total, student) => total + (student.points || 0), 0);
  }, [students]);

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

  useEffect(() => {
    if (currentView !== 'grid') {
      setIsPointLogOpen(false);
    }
  }, [currentView, setIsPointLogOpen]);

  useEffect(() => {
    const checkForVerticalScrollbar = () => {
      const docHasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      const bodyHasScrollbar = document.body.scrollHeight > window.innerHeight;
      const scrollingEl = document.scrollingElement as HTMLElement | null;
      const scrollingElHasScrollbar = scrollingEl ? scrollingEl.scrollHeight > scrollingEl.clientHeight : false;
      const dashboardScrollContainer = document.querySelector('[data-dashboard-scroll-container]') as HTMLElement | null;
      const dashboardContainerHasScrollbar = dashboardScrollContainer
        ? dashboardScrollContainer.scrollHeight > dashboardScrollContainer.clientHeight
        : false;
      const nestedScrollableCount = Array.from(document.querySelectorAll<HTMLElement>('div')).filter((el) => {
        const styles = window.getComputedStyle(el);
        const allowsYScroll = styles.overflowY === 'auto' || styles.overflowY === 'scroll';
        return allowsYScroll && el.scrollHeight > el.clientHeight;
      }).length;
      const resolvedHasScrollbar =
        dashboardContainerHasScrollbar || docHasScrollbar || bodyHasScrollbar || scrollingElHasScrollbar;
      setHasVerticalScrollbar(resolvedHasScrollbar);
    };

    checkForVerticalScrollbar();
    window.addEventListener('resize', checkForVerticalScrollbar);

    return () => {
      window.removeEventListener('resize', checkForVerticalScrollbar);
    };
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const dashboardScrollContainer = document.querySelector('[data-dashboard-scroll-container]') as HTMLElement | null;
      const nextHasScrollbar = dashboardScrollContainer
        ? dashboardScrollContainer.scrollHeight > dashboardScrollContainer.clientHeight
        : document.documentElement.scrollHeight > window.innerHeight;
      setHasVerticalScrollbar(nextHasScrollbar);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [students.length, currentView, isPointLogOpen]);

  if (isLoading) {
    return <LoadingState message="Loading students..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchStudents} />;
  }

  return (
    <>
      {/* Main Content Container for student cards */}
      <div className={currentView === 'seating' ? 'min-h-full' : ''}>
        <div
          className={
            currentView === 'grid'
              ? 'max-w-10xl mx-auto text-white-500 pr-[5.75rem] sm:pr-24'
              : 'max-w-10xl mx-auto text-white-500'
          }
        >
          {currentView === 'seating' ? (
            // Seating Chart View or Edit Mode
            // Use URL parameter as source of truth to match layout's provider
            (isSeatingEditMode || isEditModeFromURL) ? (
              <AppViewSeatingChartEditor classId={classId} students={students} />
            ) : (
              <AppViewSeatingChart
                classId={classId}
                students={students}
                setStudents={setStudents}
                isMultiSelectMode={isMultiSelectMode}
                selectedStudentIds={selectedStudentIds}
                onSelectStudent={handleSelectStudent}
              />
            )
          ) : (
            // Student Grid View (default)
            <>
              <CanvasToolbar
                className="!border-0 !bg-white"
                style={{
                  position: 'fixed',
                  right: hasVerticalScrollbar ? 24 : 8,
                  top: toolbarInset.top+1,
                  bottom: toolbarInset.bottom,
                  zIndex: 40,
                  borderRadius: 0,
                }}
                topActions={[
                  {
                    id: 'add',
                    title: 'Create layout (seating view only)',
                    disabled: true,
                    icon: <IconAddPlus className="w-6 h-6 text-gray-500" />,
                  },
                  {
                    id: 'edit',
                    title: 'Seating Editor (seating view only)',
                    disabled: true,
                    icon: <IconEditPencil className="w-6 h-6 text-gray-500" strokeWidth={2} />,
                  },
                ]}
                bottomActions={[
                  {
                    id: 'teacher-view',
                    title: "Teacher's view (seating view only)",
                    disabled: true,
                    icon: <IconPresentationBoard className="w-6 h-6 text-gray-500" strokeWidth={2} />,
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
                zIndex={35}
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

              {students.length === 0 ? (
                <EmptyState
                  title="No students yet"
                  message="Students will appear here once they are added to this class."
                  buttonText="Add Your First Student"
                  onAddClick={() => setAddStudentModalOpen(true)}
                />
              ) : isMultiSelectMode ? (
                <StudentCardsGridMulti
                  students={sortedStudents}
                  selectedStudentIds={selectedStudentIds}
                  onSelectStudent={handleSelectStudent}
                  classIcon={classIcon}
                  totalClassPoints={totalClassPoints}
                  onWholeClassClick={handleWholeClassClick}
                />
              ) : (
                <StudentCardsGrid
                  students={sortedStudents}
                  classIcon={classIcon}
                  totalClassPoints={totalClassPoints}
                  onWholeClassClick={handleWholeClassClick}
                  openDropdownId={openDropdownId}
                  onToggleDropdown={toggleDropdown}
                  onEdit={handleEditStudent}
                  onDelete={handleDeleteStudent}
                  onStudentClick={handleStudentClick}
                  onAddStudent={() => setAddStudentModalOpen(true)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Students Modal */}
      <AddStudentsModal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => setAddStudentModalOpen(false)}
        classId={classId}
        onStudentAdded={fetchStudents}
      />

      {/* Award Points Modal */}
      {selectedStudent && (
        <AwardPointsModal
          isOpen={isPointsModalOpen}
          onClose={() => {
            setPointsModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          classId={classId}
          onRefresh={fetchStudents}
          onPointsAwarded={handlePointsAwarded}
        />
      )}

      {/* Award Points Modal for Whole Class */}
      <AwardPointsModal
        isOpen={isWholeClassModalOpen}
        onClose={() => {
          setIsWholeClassModalOpen(false);
        }}
        student={null}
        classId={classId}
        className={className}
        classIcon={classIcon}
        onRefresh={fetchStudents}
        onPointsAwarded={handlePointsAwarded}
      />

      {/* Award Points Modal for Multi-Select Students */}
      {selectedStudentIds.length > 0 && (
        <AwardPointsModal
          isOpen={isMultiStudentAwardModalOpen}
          onClose={() => setIsMultiStudentAwardModalOpen(false)}
          student={null}
          classId={classId}
          selectedStudentIds={selectedStudentIds}
          onAwardComplete={handleAwardComplete}
          onRefresh={fetchStudents}
          onPointsAwarded={handlePointsAwarded}
        />
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        onRefresh={fetchStudents}
      />

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
    </>
  );
}

