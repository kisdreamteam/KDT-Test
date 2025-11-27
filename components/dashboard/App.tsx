'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import CreateClassForm from '@/components/forms/CreateClassForm';
import EditClassModal from '@/components/modals/EditClassModal';
import { useDashboard } from '@/context/DashboardContext';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import ClassCardsGrid from './maincontent/viewClassesGrid/ClassCardsGrid';
import { createClient } from '@/lib/supabase/client';

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

  const fetchStudentCounts = useCallback(async () => {
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
  }, [classes]);

  // Fetch student counts for all classes
  useEffect(() => {
    if (classes.length > 0) {
      fetchStudentCounts();
    } else {
      setStudentCounts({});
    }
  }, [classes, fetchStudentCounts]);

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

  if (isLoadingClasses) {
    return <LoadingState message="Loading classes..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshClasses} />;
  }


  return (
    // Main Content Container for the class cards grid
    <div className="max-w-full">
      {!isLoadingClasses && classes.length === 0 ? (
        <EmptyState onAddClick={() => setIsModalOpen(true)} />
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
    </div>
  );
}

