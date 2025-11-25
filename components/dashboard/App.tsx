'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import CreateClassForm from '@/components/forms/CreateClassForm';
import EditClassModal from '@/components/modals/EditClassModal';
import { useDashboard } from '@/context/DashboardContext';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import ClassCardsGrid from './ClassCardsGrid';
import ClassCardsGridMulti from './ClassCardsGridMulti';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import { createClient } from '@/lib/supabase/client';

interface Class {
  id: string;
  name: string;
  icon?: string;
}

export default function App() {
  const { classes, isLoadingClasses, refreshClasses } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveClassId, setArchiveClassId] = useState<string | null>(null);
  const [archiveClassName, setArchiveClassName] = useState<string>('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isAwardPointsModalOpen, setIsAwardPointsModalOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  // Listen for multi-select toggle event from BottomNav
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsMultiSelectMode(prev => {
        const newState = !prev;
        // Dispatch state update event so BottomNav can sync
        window.dispatchEvent(new CustomEvent('multiSelectStateChanged', { detail: { isMultiSelect: newState } }));
        if (newState === false) {
          // Clear selections when exiting multi-select mode
          setSelectedClassIds([]);
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
        // Select all classes
        const allIds = classes.map(c => c.id);
        setSelectedClassIds(allIds);
        window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: allIds.length } }));
      }
    };

    const handleSelectNone = () => {
      if (isMultiSelectMode) {
        // Deselect all classes
        setSelectedClassIds([]);
        window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: 0 } }));
      }
    };

    const handleRecentlySelect = () => {
      if (isMultiSelectMode) {
        // Get last selected class IDs from localStorage
        const lastSelected = localStorage.getItem('lastSelectedClasses');
        if (lastSelected) {
          try {
            const ids = JSON.parse(lastSelected);
            setSelectedClassIds(ids);
            window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: ids.length } }));
          } catch (e) {
            console.error('Error parsing last selected classes:', e);
          }
        }
      }
    };

    const handleAwardPoints = () => {
      if (isMultiSelectMode && selectedClassIds.length > 0) {
        setIsAwardPointsModalOpen(true);
      } else {
        alert('Please select at least one class to award points.');
      }
    };

    const handleInverseSelect = () => {
      if (isMultiSelectMode) {
        // Get all class IDs
        const allClassIds = classes.map(c => c.id);
        // Inverse: select all that are not currently selected
        const newSelectedIds = allClassIds.filter(id => !selectedClassIds.includes(id));
        setSelectedClassIds(newSelectedIds);
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
  }, [isMultiSelectMode, classes, selectedClassIds]);

  // Fetch student counts for all classes
  useEffect(() => {
    if (classes.length > 0) {
      fetchStudentCounts();
    } else {
      setStudentCounts({});
    }
  }, [classes]);

  const fetchStudentCounts = async () => {
    try {
      const supabase = createClient();
      const classIds = classes.map(cls => cls.id);
      
      if (classIds.length === 0) {
        setStudentCounts({});
        return;
      }
      
      // Fetch all students for these classes in a single query
      const { data: students, error } = await supabase
        .from('students')
        .select('class_id')
        .in('class_id', classIds);
      
      if (error) {
        console.error('Error fetching student counts:', error);
        return;
      }
      
      // Count students per class
      const countsMap: Record<string, number> = {};
      classIds.forEach(classId => {
        countsMap[classId] = 0;
      });
      
      students?.forEach(student => {
        if (student.class_id && countsMap[student.class_id] !== undefined) {
          countsMap[student.class_id]++;
        }
      });
      
      setStudentCounts(countsMap);
    } catch (err) {
      console.error('Error fetching student counts:', err);
    }
  };

  // Handle modal close with refresh
  const handleModalClose = () => {
    console.log('Modal closing, refreshing classes...');
    setIsModalOpen(false);
    refreshClasses(); // Refresh classes after modal closes
  };

  // Handle dropdown toggle
  const toggleDropdown = (classId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === classId ? null : classId);
  };

  // Handle archive class - open confirmation modal
  const handleArchiveClass = (classId: string, className: string) => {
    setArchiveClassId(classId);
    setArchiveClassName(className);
    setIsArchiveModalOpen(true);
    setOpenDropdownId(null);
  };

  // Confirm archive class
  const handleConfirmArchive = async () => {
    if (!archiveClassId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('classes')
        .update({ is_archived: true })
        .eq('id', archiveClassId);

      if (error) {
        console.error('Error archiving class:', error);
        alert('Failed to archive class. Please try again.');
        return;
      }

      console.log('Class archived successfully');
      refreshClasses(); // Refresh the list
      // Dispatch event to refresh sidebar classes
      window.dispatchEvent(new CustomEvent('classUpdated'));
    } catch (err) {
      console.error('Unexpected error archiving class:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsArchiveModalOpen(false);
      setArchiveClassId(null);
      setArchiveClassName('');
    }
  };

  // Handle edit class
  const handleEditClass = (classId: string) => {
    setOpenDropdownId(null);
    setSelectedClassId(classId);
    setIsEditModalOpen(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedClassId(null);
    refreshClasses(); // Refresh classes after modal closes
  };

  // Handle multi-select mode toggle
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (isMultiSelectMode) {
      // Clear selections when exiting multi-select mode
      setSelectedClassIds([]);
    }
  };

  // Handle class selection in multi-select mode
  const handleSelectClass = (classId: string) => {
    setSelectedClassIds(prev => {
      const newSelection = prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId];
      
      // Dispatch selection count change event for BottomNav
      window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: newSelection.length } }));
      
      return newSelection;
    });
  };

  // Dispatch selection count when selection changes
  useEffect(() => {
    if (isMultiSelectMode) {
      window.dispatchEvent(new CustomEvent('selectionCountChanged', { detail: { count: selectedClassIds.length } }));
    }
  }, [selectedClassIds, isMultiSelectMode]);

  // Handle award complete - store selected class IDs in localStorage
  const handleAwardComplete = (selectedIds: string[], type: 'classes' | 'students') => {
    if (type === 'classes') {
      localStorage.setItem('lastSelectedClasses', JSON.stringify(selectedIds));
      // Notify BottomNav that recently selected data is now available
      window.dispatchEvent(new CustomEvent('recentlySelectedUpdated'));
    }
  };

  // Get selected classes data for the modal
  const selectedClasses = classes.filter(c => selectedClassIds.includes(c.id));

  if (isLoadingClasses) {
    return <LoadingState message="Loading classes..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshClasses} />;
  }


  return (
    // Main Content Container for the class cards grid
    <div className="max-w-full">
      {/* Multi-Select Toggle Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleToggleMultiSelect}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isMultiSelectMode
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isMultiSelectMode ? 'Exit Multi-Select' : 'Multiple Select'}
        </button>
      </div>

      {!isLoadingClasses && classes.length === 0 ? (
        <EmptyState onAddClick={() => setIsModalOpen(true)} />
      ) : isMultiSelectMode ? (
        <ClassCardsGridMulti
          classes={classes}
          studentCounts={studentCounts}
          selectedClassIds={selectedClassIds}
          onSelectClass={handleSelectClass}
        />
      ) : (
        <ClassCardsGrid
          classes={classes}
          studentCounts={studentCounts}
          openDropdownId={openDropdownId}
          onToggleDropdown={toggleDropdown}
          onEdit={handleEditClass}
          onArchive={handleArchiveClass}
          onAddClass={() => setIsModalOpen(true)}
        />
      )}

      {/* Create Class Modal */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <CreateClassForm onClose={handleModalClose} />
      </Modal>

      {/* Edit Class Modal */}
      {selectedClassId && (
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          classId={selectedClassId}
          onRefresh={refreshClasses}
        />
      )}

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setArchiveClassId(null);
          setArchiveClassName('');
        }}
        onConfirm={handleConfirmArchive}
        title="Archive Class"
        message={`Are you sure you want to archive "${archiveClassName}"? This class will be moved to your archived classes and removed from the main dashboard.`}
        confirmText="Archive"
        cancelText="Cancel"
        confirmButtonColor="purple"
        icon={
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
          </svg>
        }
      />

      {/* Award Points Modal for Multi-Select */}
      {selectedClassIds.length > 0 && (
        <AwardPointsModal
          isOpen={isAwardPointsModalOpen}
          onClose={() => setIsAwardPointsModalOpen(false)}
          student={null}
          classId={selectedClassIds[0]} // Use first class for categories
          selectedClassIds={selectedClassIds}
          classes={selectedClasses}
          onAwardComplete={handleAwardComplete}
          onRefresh={refreshClasses}
        />
      )}
    </div>
  );
}

