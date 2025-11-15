'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import CreateClassForm from '@/components/forms/CreateClassForm';
import EditClassModal from '@/components/modals/EditClassModal';
import { useDashboard } from '@/context/DashboardContext';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import ClassCardsGrid from './ClassCardsGrid';
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

  // Handle archive class
  const handleArchiveClass = async (classId: string, className: string) => {
    if (confirm(`Are you sure you want to archive this class?`)) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('classes')
          .update({ is_archived: true })
          .eq('id', classId);

        if (error) {
          console.error('Error archiving class:', error);
          alert('Failed to archive class. Please try again.');
          return;
        }

        console.log('Class archived successfully');
        setOpenDropdownId(null);
        refreshClasses(); // Refresh the list
      } catch (err) {
        console.error('Unexpected error archiving class:', err);
        alert('An unexpected error occurred. Please try again.');
      }
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
    </div>
  );
}

