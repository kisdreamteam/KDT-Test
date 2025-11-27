'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import EmptyState from '../EmptyState';
import ClassCardsGrid from './viewClassesGrid/ClassCardsGrid';

interface Class {
  id: string;
  name: string;
  icon?: string;
}

export default function ArchivedClassesApp() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false);
  const [unarchiveClassId, setUnarchiveClassId] = useState<string | null>(null);
  const [unarchiveClassName, setUnarchiveClassName] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [deleteClassName, setDeleteClassName] = useState<string>('');

  // Fetch archived classes
  useEffect(() => {
    fetchArchivedClasses();
  }, []);

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

  const fetchArchivedClasses = async () => {
    try {
      setIsLoadingClasses(true);
      setError(null);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setError('User not authenticated');
        return;
      }

      // Fetch archived classes for the current teacher
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_archived', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching archived classes:', error);
        setError('Failed to load archived classes');
        return;
      }

      setClasses(data || []);
    } catch (err) {
      console.error('Unexpected error fetching archived classes:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  // Handle dropdown toggle
  const toggleDropdown = (classId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === classId ? null : classId);
  };

  // Handle unarchive class - open confirmation modal
  const handleUnarchiveClass = (classId: string, className: string) => {
    setUnarchiveClassId(classId);
    setUnarchiveClassName(className);
    setIsUnarchiveModalOpen(true);
    setOpenDropdownId(null);
  };

  // Confirm unarchive class
  const handleConfirmUnarchive = async () => {
    if (!unarchiveClassId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('classes')
        .update({ is_archived: false })
        .eq('id', unarchiveClassId);

      if (error) {
        console.error('Error unarchiving class:', error);
        alert('Failed to unarchive class. Please try again.');
        return;
      }

      console.log('Class unarchived successfully');
      fetchArchivedClasses(); // Refresh the archived classes list
      // Dispatch event to refresh main dashboard
      window.dispatchEvent(new CustomEvent('classUpdated'));
    } catch (err) {
      console.error('Unexpected error unarchiving class:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsUnarchiveModalOpen(false);
      setUnarchiveClassId(null);
      setUnarchiveClassName('');
    }
  };

  // Handle edit class (placeholder - you may want to implement this)
  const handleEditClass = (classId: string) => {
    setOpenDropdownId(null);
    // You can implement edit functionality here if needed
    console.log('Edit class:', classId);
  };

  // Handle delete class - open confirmation modal
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
      fetchArchivedClasses(); // Refresh the archived classes list
    } catch (err) {
      console.error('Unexpected error deleting class:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteClassId(null);
      setDeleteClassName('');
    }
  };

  if (isLoadingClasses) {
    return <LoadingState message="Loading archived classes..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchArchivedClasses} />;
  }

  return (
    <div className="max-w-full bg-[#fcf1f0]">
      <div className="bg-blue-100 rounded-3xl p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Archived Classes</h1>
      </div>
      
      {!isLoadingClasses && classes.length === 0 ? (
        <EmptyState 
          onAddClick={() => {}} 
          title="No Archived Classes"
          message="Classes you archive will appear here"
          buttonText=""
        />
      ) : (
        <ClassCardsGrid
          classes={classes}
          studentCounts={studentCounts}
          openDropdownId={openDropdownId}
          onToggleDropdown={toggleDropdown}
          onEdit={handleEditClass}
          onArchive={handleUnarchiveClass}
          onAddClass={() => {}}
          archiveButtonText="Unarchive Class"
          showAddCard={false}
          onDelete={handleDeleteClass}
          showDelete={true}
        />
      )}

      {/* Unarchive Confirmation Modal */}
      <ConfirmationModal
        isOpen={isUnarchiveModalOpen}
        onClose={() => {
          setIsUnarchiveModalOpen(false);
          setUnarchiveClassId(null);
          setUnarchiveClassName('');
        }}
        onConfirm={handleConfirmUnarchive}
        title="Unarchive Class"
        message={`Are you sure you want to unarchive "${unarchiveClassName}"? This class will be restored to your main dashboard.`}
        confirmText="Unarchive"
        cancelText="Cancel"
        confirmButtonColor="green"
        icon={
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        }
      />

      {/* Delete Confirmation Modal */}
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
    </div>
  );
}

