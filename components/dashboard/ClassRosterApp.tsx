'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AddStudentsModal from '@/components/modals/AddStudentsModal';
import AwardPointsModal from '@/components/modals/AwardPointsModal';
import EditStudentModal from '@/components/modals/EditStudentModal';
import PointsAwardedConfirmationModal from '@/components/modals/PointsAwardedConfirmationModal';
import { Student } from '@/lib/types';
import { useStudentSort } from '@/context/StudentSortContext';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import StudentCardsGrid from './StudentCardsGrid';

export default function ClassRosterApp() {
  const params = useParams();
  const classId = params.classId as string;
  const { sortBy } = useStudentSort();
  const [students, setStudents] = useState<Student[]>([]);
  const [className, setClassName] = useState<string>('');
  const [classIcon, setClassIcon] = useState<string>('/images/dashboard/icons/icon-1.png');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isPointsModalOpen, setPointsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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

  useEffect(() => {
    if (classId) {
      fetchClass();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

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
        setClassIcon(classData.icon || '/images/dashboard/icons/icon-1.png');
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
    } else {
      // Alphabetical sort by last name, then first name
      return studentsCopy.sort((a, b) => {
        const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
    }
  }, [students, sortBy]);

  // Calculate total points for the whole class
  const totalClassPoints = useMemo(() => {
    return students.reduce((total, student) => total + (student.points || 0), 0);
  }, [students]);

  if (isLoading) {
    return <LoadingState message="Loading students..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchStudents} />;
  }

  return (
    <>
      <div className="min-h-full bg-[#4A3B8D]">
        <div className="max-w-10xl mx-auto text-white-500">
          {students.length === 0 ? (
            <EmptyState
              title="No students yet"
              message="Students will appear here once they are added to this class."
              buttonText="Add Your First Student"
              onAddClick={() => setAddStudentModalOpen(true)}
            />
          ) : (
            <StudentCardsGrid
              students={sortedStudents}
              classIcon={classIcon}
              totalClassPoints={totalClassPoints}
              openDropdownId={openDropdownId}
              onToggleDropdown={toggleDropdown}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
              onStudentClick={handleStudentClick}
              onAddStudent={() => setAddStudentModalOpen(true)}
            />
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

