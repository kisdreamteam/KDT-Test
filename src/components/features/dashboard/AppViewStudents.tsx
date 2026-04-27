'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/client';
import { Student } from '@/lib/types';
import { useStudentSort } from '@/context/StudentSortContext';
import { useDashboard } from '@/context/DashboardContext';
import { normalizeClassIconPath } from '@/lib/iconUtils';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import StudentsMainContent from './maincontent/StudentsMainContent';
import StudentsModals from './maincontent/StudentsModals';
import IconAddPlus from '@/components/iconsCustom/iconAddPlus';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import IconPresentationBoard from '@/components/iconsCustom/iconPresentationBoard';
import IconDocumentClock from '@/components/iconsCustom/iconDocumentClock';
import { useClassPointLog } from '@/hooks/useClassPointLog';
import { useDashboardToolbarInset } from '@/hooks/useDashboardToolbarInset';
import { useAwardPointsFlow } from '@/hooks/useAwardPointsFlow';
import { useStageToolbar } from './StageToolbarContext';

export default function AppViewStudents() {
  const params = useParams();
  const classId = (params?.classId as string | undefined) ?? '';
  const searchParams = useSearchParams();
  const { sortBy } = useStudentSort();
  const { classes, students, setStudents, isLoadingStudents, refreshStudents } = useDashboard();
  
  // Get current view mode from URL
  const currentView = searchParams?.get('view') || 'grid';
  const currentMode = searchParams?.get('mode') || '';
  const { setToolbar } = useStageToolbar();
  // Check if we're in edit mode from URL (this should match layout's isEditMode)
  const isEditModeFromURL = currentMode === 'edit';
  const [classIcon, setClassIcon] = useState<string>('/images/dashboard/class-icons/icon-1.png');
  const [error, setError] = useState<string | null>(null);
  const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isPointsModalOpen, setPointsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isWholeClassModalOpen, setIsWholeClassModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const {
    awardInfo,
    isConfirmationModalOpen,
    openAwardConfirmation,
    closeAwardConfirmation,
  } = useAwardPointsFlow();
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isMultiStudentAwardModalOpen, setIsMultiStudentAwardModalOpen] = useState(false);
  const [isSeatingEditMode, setIsSeatingEditMode] = useState(false);
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  // When switching from Seating Chart to Student Grid, refetch students so the grid shows updated points
  useEffect(() => {
    if (prevViewRef.current === 'seating' && currentView === 'grid' && classId) {
      void refreshStudents();
    }
    prevViewRef.current = currentView;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, classId, refreshStudents]);

  useEffect(() => {
    const currentClass = classes.find((c) => c.id === classId);
    if (!currentClass) return;
    setClassIcon(normalizeClassIconPath(currentClass.icon));
  }, [classId, classes]);

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
        void refreshStudents();
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
    openAwardConfirmation(info);
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
    if (currentView !== 'grid') {
      setToolbar(null);
      return;
    }

    setToolbar({
      className: '!bg-white',
      topActions: [
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
      ],
      bottomActions: [
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
      ],
    });

    return () => {
      setToolbar(null);
    };
  }, [currentView, isPointLogOpen, setIsPointLogOpen, setToolbar]);

  if (isLoadingStudents) {
    return <LoadingState message="Loading students..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => void refreshStudents()} />;
  }

  return (
    <>
      <StudentsMainContent
        classId={classId}
        currentView={currentView}
        isSeatingEditMode={isSeatingEditMode}
        isEditModeFromURL={isEditModeFromURL}
        students={students}
        setStudents={setStudents}
        sortedStudents={sortedStudents}
        isMultiSelectMode={isMultiSelectMode}
        selectedStudentIds={selectedStudentIds}
        classIcon={classIcon}
        totalClassPoints={totalClassPoints}
        openDropdownId={openDropdownId}
        isPointLogOpen={isPointLogOpen}
        isPointLogLoading={isPointLogLoading}
        pointLogError={pointLogError}
        logTotalCount={logTotalCount}
        pagedPointLogRows={pagedPointLogRows}
        safeLogPage={safeLogPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        toolbarTopPx={toolbarInset.top}
        toolbarBottomPx={toolbarInset.bottom}
        setLogPage={setLogPage}
        setRowsPerPage={setRowsPerPage}
        onSelectStudent={handleSelectStudent}
        onToggleDropdown={toggleDropdown}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onStudentClick={handleStudentClick}
        onWholeClassClick={handleWholeClassClick}
        onAddStudent={() => setAddStudentModalOpen(true)}
      />

      <StudentsModals
        classId={classId}
        className={classes.find((c) => c.id === classId)?.name || ''}
        classIcon={classIcon}
        students={students}
        selectedStudent={selectedStudent}
        editingStudent={editingStudent}
        selectedStudentIds={selectedStudentIds}
        awardInfo={awardInfo}
        isAddStudentModalOpen={isAddStudentModalOpen}
        isPointsModalOpen={isPointsModalOpen}
        isWholeClassModalOpen={isWholeClassModalOpen}
        isEditStudentModalOpen={isEditStudentModalOpen}
        isMultiStudentAwardModalOpen={isMultiStudentAwardModalOpen}
        isConfirmationModalOpen={isConfirmationModalOpen}
        onStudentAdded={() => void refreshStudents()}
        onCloseAddStudentsModal={() => setAddStudentModalOpen(false)}
        onClosePointsModal={() => {
          setPointsModalOpen(false);
          setSelectedStudent(null);
        }}
        onCloseWholeClassModal={() => setIsWholeClassModalOpen(false)}
        onCloseEditStudentModal={() => {
          setIsEditStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onCloseMultiStudentAwardModal={() => setIsMultiStudentAwardModalOpen(false)}
        onCloseConfirmationModal={() => {
          closeAwardConfirmation();
        }}
        onAwardComplete={handleAwardComplete}
        onPointsAwarded={handlePointsAwarded}
      />
    </>
  );
}

