'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/modals/Modal';
import ConfirmationModal from '@/components/modals/ConfirmationModal';
import CreateClassForm from '@/components/forms/CreateClassForm';
import EditClassModal from '@/components/modals/EditClassModal';
import { useDashboard } from '@/context/DashboardContext';
import LoadingState from './maincontent/LoadingState';
import ErrorState from './maincontent/ErrorState';
import EmptyState from './maincontent/EmptyState';
import ClassCardsGrid from './maincontent/viewClassesGrid/ClassCardsGrid';
import { createClient } from '@/lib/supabase/client';

export default function AppViewClasses() {
  const { classes, isLoadingClasses, refreshClasses, viewMode } = useDashboard();  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveClassId, setArchiveClassId] = useState<string | null>(null);
  const [archiveClassName, setArchiveClassName] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [deleteClassName, setDeleteClassName] = useState<string>('');

  const isArchivedView = viewMode === 'archived';

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

  // Handle archive/unarchive class - open confirmation modal
  const handleArchiveClass = (classId: string, className: string) => {
    setArchiveClassId(classId);
    setArchiveClassName(className);
    setIsArchiveModalOpen(true);
    setOpenDropdownId(null);
  };

  // Confirm archive/unarchive class
  const handleConfirmArchive = async () => {
    if (!archiveClassId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('classes')
        .update({ is_archived: !isArchivedView }) // Toggle archived status
        .eq('id', archiveClassId);

      if (error) {
        console.error(`Error ${isArchivedView ? 'unarchiving' : 'archiving'} class:`, error);
        alert(`Failed to ${isArchivedView ? 'unarchive' : 'archive'} class. Please try again.`);
        return;
      }

      console.log(`Class ${isArchivedView ? 'unarchived' : 'archived'} successfully`);
      refreshClasses(); // Refresh the list
      // Dispatch event to refresh sidebar classes
      window.dispatchEvent(new CustomEvent('classUpdated'));
    } catch (err) {
      console.error('Unexpected error:', err);
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

  // Handle delete class (archived only)
  const handleDeleteClass = (classId: string, className: string) => {
    setDeleteClassId(classId);
    setDeleteClassName(className);
    setIsDeleteModalOpen(true);
    setOpenDropdownId(null);
  };

  // Confirm delete class
  const handleConfirmDelete = async () => {
    if (!deleteClassId) return;

    try {
      const supabase = createClient();
      
      // First, delete all students in this class
      const { error: studentsError } = await supabase
        .from('students')
        .delete()
        .eq('class_id', deleteClassId);

      if (studentsError) {
        console.error('Error deleting students:', studentsError);
        alert('Failed to delete students. Please try again.');
        return;
      }

      // Then delete the class
      const { error: classError } = await supabase
        .from('classes')
        .delete()
        .eq('id', deleteClassId);

      if (classError) {
        console.error('Error deleting class:', classError);
        alert('Failed to delete class. Please try again.');
        return;
      }

      console.log('Class deleted successfully');
      refreshClasses(); // Refresh the archived classes list
    } catch (err) {
      console.error('Unexpected error deleting class:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteClassId(null);
      setDeleteClassName('');
    }
  };

  // Render loading state
  if (isLoadingClasses) {
    return <LoadingState message={`Loading ${isArchivedView ? 'archived ' : ''}classes...`} />;
  }

  // Render error state
  if (error) {
    return <ErrorState error={error} onRetry={refreshClasses} />;
  }

  return (
    // Main Content Container for the class cards grid
    <div className="max-w-full">
      {/* Header for archived view */}
      {isArchivedView && (
        <div className="bg-blue-100 rounded-3xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Archived Classes</h1>
        </div>
      )}

      {!isLoadingClasses && classes.length === 0 ? (
        <EmptyState 
          onAddClick={() => !isArchivedView && setIsModalOpen(true)} 
          title={isArchivedView ? "No Archived Classes" : undefined}
          message={isArchivedView ? "Classes you archive will appear here" : undefined}
          buttonText={isArchivedView ? "" : undefined}
        />
      ) : (
        <ClassCardsGrid
          classes={classes}
          studentCounts={studentCounts}
          openDropdownId={openDropdownId}
          onToggleDropdown={toggleDropdown}
          onEdit={handleEditClass}
          onArchive={handleArchiveClass}
          onAddClass={() => !isArchivedView && setIsModalOpen(true)}
          archiveButtonText={isArchivedView ? "Unarchive Class" : "Archive Class"}
          showAddCard={!isArchivedView}
          onDelete={isArchivedView ? handleDeleteClass : undefined}
          showDelete={isArchivedView}
        />
      )}

      {/* Create Class Modal - only for active view */}
      {!isArchivedView && (
        <Modal isOpen={isModalOpen} onClose={handleModalClose}>
          <CreateClassForm onClose={handleModalClose} />
        </Modal>
      )}

      {/* Edit Class Modal */}
      {selectedClassId && (
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          classId={selectedClassId}
          onRefresh={refreshClasses}
        />
      )}

      {/* Archive/Unarchive Confirmation Modal */}
      <ConfirmationModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setArchiveClassId(null);
          setArchiveClassName('');
        }}
        onConfirm={handleConfirmArchive}
        title={isArchivedView ? "Unarchive Class" : "Archive Class"}
        message={isArchivedView 
          ? `Are you sure you want to unarchive "${archiveClassName}"? This class will be restored to your main dashboard.`
          : `Are you sure you want to archive "${archiveClassName}"? This class will be moved to your archived classes and removed from the main dashboard.`
        }
        confirmText={isArchivedView ? "Unarchive" : "Archive"}
        cancelText="Cancel"
        confirmButtonColor={isArchivedView ? "green" : "purple"}
        icon={
          <svg className={`w-6 h-6 ${isArchivedView ? 'text-green-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isArchivedView ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
            )}
          </svg>
        }
      />

      {/* Delete Confirmation Modal - only for archived view */}
      {isArchivedView && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeleteClassId(null);
            setDeleteClassName('');
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Class"
          message={`Are you sure you want to permanently delete "${deleteClassName}"? This action cannot be undone and will delete all students in this class.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonColor="red"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        />
      )}
    </div>
  );
}
