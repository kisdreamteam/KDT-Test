'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Modal from '@/components/modals/Modal';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';
import AddStudentsModal from '@/components/modals/AddStudentsModal';

interface Teacher {
  id: string;
  email: string;
  name?: string;
}

interface TeacherDataItem {
  teacher_email: string;
  teachers?: {
    id: string;
    email: string;
    name?: string;
  }[] | null;
}

interface StudentWithPhoto extends Student {
  photo?: string;
}

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onRefresh: () => void;
}

export default function EditClassModal({ isOpen, onClose, classId, onRefresh }: EditClassModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'teachers' | 'settings'>('info');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('/images/dashboard/class-icons/icon-1.png');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<StudentWithPhoto[]>([]);
  const [originalStudents, setOriginalStudents] = useState<StudentWithPhoto[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [studentsWithoutFirstName, setStudentsWithoutFirstName] = useState<StudentWithPhoto[]>([]);
  const [showResetPointsPopup, setShowResetPointsPopup] = useState(false);
  const [isResettingPoints, setIsResettingPoints] = useState(false);

  // Generate array of all available icons
  const availableIcons = Array.from({ length: 15 }, (_, i) => 
    `/images/dashboard/class-icons/icon-${i + 1}.png`
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };

    if (isIconDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isIconDropdownOpen]);

  const fetchClassData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) {
        console.error('Error fetching class:', error);
        return;
      }

      if (data) {
        setClassName(data.name || '');
        setGrade(data.grade || '');
        setSelectedIcon(data.icon || '/images/dashboard/class-icons/icon-1.png');
      }
    } catch (err) {
      console.error('Unexpected error fetching class:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [classId]);

  const fetchStudents = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, avatar, student_number, gender, class_id, points')
        .eq('class_id', classId);

      if (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
        return;
      }

      if (studentsData) {
        // Sort by student number first (nulls last), then by first name alphabetically
        const sortedStudents = [...studentsData].sort((a, b) => {
          // Primary sort: student_number
          // Handle null values - put them at the end
          if (a.student_number === null && b.student_number === null) {
            // Both null, sort by first name
            return (a.first_name || '').localeCompare(b.first_name || '');
          }
          if (a.student_number === null) return 1; // a goes to end
          if (b.student_number === null) return -1; // b goes to end
          
          // Both have numbers, compare them
          if (a.student_number !== b.student_number) {
            return a.student_number - b.student_number;
          }
          
          // If student numbers are equal, sort by first name (secondary sort)
          return (a.first_name || '').localeCompare(b.first_name || '');
        });
        
        const typedStudents = sortedStudents as StudentWithPhoto[];
        setStudents(typedStudents);
        setOriginalStudents(JSON.parse(JSON.stringify(typedStudents))); // Deep copy for comparison
        setHasUnsavedChanges(false);
      } else {
        setStudents([]);
        setOriginalStudents([]);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err);
      setStudents([]);
      setOriginalStudents([]);
      setHasUnsavedChanges(false);
    }
  }, [classId]);

  const fetchTeachers = useCallback(async () => {
    try {
      const supabase = createClient();
      // For now, we'll fetch teachers from a class_teachers junction table if it exists
      // If not, we'll use a placeholder structure
      // Assuming there's a class_teachers table with class_id and teacher_id/email
      const { data: teachersData, error } = await supabase
        .from('class_teachers')
        .select(`
          teacher_email,
          teachers:teacher_id (
            id,
            email,
            name
          )
        `)
        .eq('class_id', classId);

      if (error) {
        // If table doesn't exist, set empty array
        console.log('No class_teachers table or no teachers found');
        setTeachers([]);
        return;
      }

      // Transform the data to match our Teacher interface
      if (teachersData) {
        const typedData = teachersData as unknown as TeacherDataItem[];
        const teachersList: Teacher[] = typedData.map((item: TeacherDataItem) => {
          const teacher = Array.isArray(item.teachers) ? item.teachers[0] : item.teachers;
          return {
            id: teacher?.id || item.teacher_email,
            email: teacher?.email || item.teacher_email,
            name: teacher?.name
          };
        });
        setTeachers(teachersList);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching teachers:', err);
      setTeachers([]);
    }
  }, [classId]);

  // Fetch class data
  useEffect(() => {
    if (isOpen && classId) {
      fetchClassData();
      fetchStudents();
      fetchTeachers();
    }
  }, [isOpen, classId, fetchClassData, fetchStudents, fetchTeachers]);

  const handleSaveInfo = async () => {
    if (!className.trim()) {
      alert('Please enter a class name.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('classes')
        .update({
          name: className.trim(),
          grade: grade.trim(),
          icon: selectedIcon
        })
        .eq('id', classId);

      if (error) {
        console.error('Error updating class:', error);
        alert('Failed to update class. Please try again.');
        return;
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error('Unexpected error updating class:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    if (!newTeacherEmail.trim()) {
      alert('Please enter an email address.');
      return;
    }

    const email = newTeacherEmail.trim().toLowerCase();
    
    // Basic email validation
    if (!email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Check if class_teachers table exists, if not we'll just add to a simple structure
      // For now, we'll try to insert into class_teachers
      const { error } = await supabase
        .from('class_teachers')
        .insert({
          class_id: classId,
          teacher_email: email
        });

      if (error) {
        // If the table doesn't exist or there's an error, we'll just show a message
        console.log('Could not add teacher (table may not exist):', error);
        alert('Teacher collaboration feature is being set up. This will be available soon.');
        setNewTeacherEmail('');
        setIsLoading(false);
        return;
      }

      // Refresh teachers list
      await fetchTeachers();
      setNewTeacherEmail('');
      alert('Teacher added successfully!');
    } catch (err) {
      console.error('Unexpected error adding teacher:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTeacher = async (teacherEmail: string) => {
    if (!confirm(`Are you sure you want to remove this teacher?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('class_teachers')
        .delete()
        .eq('class_id', classId)
        .eq('teacher_email', teacherEmail);

      if (error) {
        console.error('Error removing teacher:', error);
        alert('Failed to remove teacher. Please try again.');
        return;
      }

      await fetchTeachers();
      alert('Teacher removed successfully!');
    } catch (err) {
      console.error('Unexpected error removing teacher:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenderChange = (studentId: string, newGender: string | null) => {
    // Update local state only, mark as changed
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? { ...student, gender: newGender }
          : student
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleGenderToggle = (studentId: string, targetGender: 'Boy' | 'Girl') => {
    // Get current gender from state to ensure we have the latest value
    setStudents(prevStudents => {
      const student = prevStudents.find(s => s.id === studentId);
      const currentGender = student?.gender;
      // Toggle: if already the target gender, set to null; otherwise set to target gender
      const newGender = currentGender === targetGender ? null : targetGender;
      
      return prevStudents.map(s =>
        s.id === studentId
          ? { ...s, gender: newGender }
          : s
      );
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveAllChanges = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // Validate all changes before saving - collect students without first names
      const invalidStudents = students.filter(student => !student.first_name?.trim());
      
      if (invalidStudents.length > 0) {
        setStudentsWithoutFirstName(invalidStudents);
        setShowValidationWarning(true);
        setIsLoading(false);
        return;
      }

      // Save all changes
      const updatePromises = students.map(async (student) => {
        const originalStudent = originalStudents.find(s => s.id === student.id);
        if (!originalStudent) return;

        // Check if any field has changed
        const hasChanged = 
          student.first_name !== originalStudent.first_name ||
          student.last_name !== originalStudent.last_name ||
          student.student_number !== originalStudent.student_number ||
          student.gender !== originalStudent.gender;

        if (!hasChanged) return;

        // Prepare update data
        const updateData: {
          first_name: string;
          last_name: string | null;
          student_number: number | null;
          gender: string | null;
        } = {
          first_name: student.first_name.trim(),
          last_name: student.last_name?.trim() || null,
          student_number: student.student_number,
          gender: student.gender
        };

        const { error } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', student.id);

        if (error) {
          console.error(`Error updating student ${student.id}:`, error);
          throw error;
        }
      });

      await Promise.all(updatePromises);
      
      // Refresh students and reset change tracking
      await fetchStudents();
      setHasUnsavedChanges(false);
      
      // Show confirmation popup instead of alert
      setShowSaveConfirmation(true);
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save some changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToDashboard = () => {
    setShowSaveConfirmation(false);
    onClose();
    onRefresh();
    router.push('/dashboard');
  };

  const handleContinueEditing = () => {
    setShowSaveConfirmation(false);
  };

  const handleCancelChanges = () => {
    // Revert to original students
    setStudents(JSON.parse(JSON.stringify(originalStudents))); // Deep copy
    setHasUnsavedChanges(false);
  };

  const handleSwitchFirstAndLastNames = () => {
    // Swap first_name and last_name for all students
    setStudents(prevStudents =>
      prevStudents.map(student => ({
        ...student,
        first_name: (student.last_name || '') as string,
        last_name: student.first_name
      }))
    );
    setHasUnsavedChanges(true);
  };

  // Handle reset points
  const handleResetPoints = async (deleteEvents: boolean) => {
    if (isResettingPoints) return;
    
    setIsResettingPoints(true);
    
    try {
      const supabase = createClient();
      
      // Get all students in this class
      const { data: studentsData, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', classId);
      
      if (fetchError) {
        console.error('Error fetching students:', fetchError);
        alert('Failed to fetch students. Please try again.');
        setIsResettingPoints(false);
        return;
      }
      
      if (!studentsData || studentsData.length === 0) {
        alert('No students found in this class.');
        setIsResettingPoints(false);
        return;
      }
      
      const studentIds = studentsData.map(s => s.id);
      
      // If deleteEvents is true, delete all point events for these students
      if (deleteEvents) {
        const { error: deleteError } = await supabase
          .from('custom_point_events')
          .delete()
          .in('student_id', studentIds);
        
        if (deleteError) {
          console.error('Error deleting point events:', deleteError);
          alert('Failed to delete point events. Please try again.');
          setIsResettingPoints(false);
          return;
        }
      }
      
      // Reset all students' points to 0
      const { error: updateError } = await supabase
        .from('students')
        .update({ points: 0 })
        .in('id', studentIds);
      
      if (updateError) {
        console.error('Error resetting points:', updateError);
        alert('Failed to reset points. Please try again.');
        setIsResettingPoints(false);
        return;
      }
      
      // Refresh data
      await fetchStudents();
      if (onRefresh) {
        onRefresh();
      }
      
      // Close popup and show success message
      setShowResetPointsPopup(false);
      alert(`Points have been reset successfully.${deleteEvents ? ' All point events have been deleted.' : ' Point events have been preserved.'}`);
      
    } catch (err) {
      console.error('Unexpected error resetting points:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsResettingPoints(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="bg-[#F5F5F5] rounded-[28px] p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-[#4A3B8D] mb-2">Edit Class</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'info'
                ? 'text-[#4A3B8D]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Info
            {activeTab === 'info' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D96B7B]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'students'
                ? 'text-[#4A3B8D]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Students
            {activeTab === 'students' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D96B7B]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'teachers'
                ? 'text-[#4A3B8D]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Teachers
            {activeTab === 'teachers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D96B7B]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'settings'
                ? 'text-[#4A3B8D]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D96B7B]"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3B8D] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading class data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Icon Picker */}
                  <div className="flex justify-center mb-6">
                    <div className="relative" ref={dropdownRef}>
                      {/* Selected Icon Display (Clickable) */}
                      <button
                        type="button"
                        onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-gray-300 hover:border-[#4A3B8D] relative shadow-sm"
                      >
                        <Image
                          src={selectedIcon}
                          alt="Class icon"
                          width={60}
                          height={60}
                          className="w-14 h-14 object-contain"
                        />
                        {/* Down Arrow Indicator */}
                        <div className="absolute bottom-0 right-0 bg-[#D96B7B] rounded-full p-1 border-2 border-white">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Icon Dropdown */}
                      {isIconDropdownOpen && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsIconDropdownOpen(false)}
                          />
                          
                          {/* Dropdown Menu */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20 w-80 max-h-96 overflow-y-auto">
                            <div className="text-sm font-semibold text-gray-700 mb-3 text-center">
                              Choose Class Icon
                            </div>
                            
                            {/* Icons Grid */}
                            <div className="grid grid-cols-5 gap-3">
                              {availableIcons.map((icon, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setSelectedIcon(icon);
                                    setIsIconDropdownOpen(false);
                                  }}
                                  className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all hover:scale-110 ${
                                    selectedIcon === icon
                                      ? 'border-[#4A3B8D] bg-[#4A3B8D]/10'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <Image
                                    src={icon}
                                    alt={`Icon ${index + 1}`}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-contain"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Class Name
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                      placeholder="Enter class name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Grade
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                    >
                      <option value="">Select a grade</option>
                      <option value="Grade1">Grade 1</option>
                      <option value="Grade2">Grade 2</option>
                      <option value="Grade3">Grade 3</option>
                      <option value="Grade4">Grade 4</option>
                      <option value="Grade5">Grade 5</option>
                      <option value="Grade6">Grade 6</option>
                      <option value="Grade7">Grade 7</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveInfo}
                      disabled={isLoading}
                      className="px-6 py-2 bg-[#D96B7B] text-white rounded-lg font-bold hover:brightness-95 transition disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="flex flex-col h-full min-h-[400px] max-h-[600px]">
              {isLoadingData ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3B8D] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {/* Add New Student Option - Always First */}
                    <button
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-800">Add New Student</span>
                    </button>

                    {/* Column Headers */}
                    {students.length > 0 && (
                      <div className="w-full flex items-center justify-between px-3 bg-gray-100 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 flex-shrink-0"></div>
                          <span className="w-55 text-xs font-semibold text-gray-600 uppercase">First Name</span>
                          <span className="w-53 text-xs font-semibold text-gray-600 uppercase">Last Name</span>
                        {/* </div>
                        <div className="flex items-center gap-4 ml-4"> */}
                          <span className="w-35 text-xs font-semibold text-gray-600 uppercase">Student Number</span>
                          <span className="text-xs font-semibold text-gray-600 uppercase">Gender</span>
                        </div>
                      </div>
                    )}

                    {/* Students List */}
                    {students.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 text-sm">No students in this class yet.</p>
                      </div>
                    ) : (
                      students.map((student) => {
                      const imageSrc = student.avatar || "/images/students/avatars/student_avatar_1.png";
                      const currentGender = student.gender;
                      return (
                        <div
                          key={student.id}
                          className="w-full flex gap-1 items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          {/* image and edit inputs with radio buttons with rounded corners */}
                          <div className="flex items-center space-x-1 flex-1 gap-4">
                            <div className="w-10 h-10 flex-shrink-0">
                              <Image
                                src={imageSrc}
                                alt={`${student.first_name} ${student.last_name}`}
                                width={40}
                                height={40}
                                className="rounded-full object-cover w-10 h-10"
                              />
                            </div>
                            {/* First Name Input */}
                            <input
                              type="text"
                              value={student.first_name || ''}
                              onChange={(e) => {
                                // Update local state immediately for responsive UI
                                setStudents(prevStudents =>
                                  prevStudents.map(s =>
                                    s.id === student.id
                                      ? { ...s, first_name: e.target.value }
                                      : s
                                  )
                                );
                                setHasUnsavedChanges(true);
                              }}
                              className="w-50 h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-800 outline-none focus:border-[#4A3B8D] focus:ring-1 focus:ring-[#4A3B8D]"
                              placeholder="First name"
                            />
                            {/* Last Name Input */}
                            <input
                              type="text"
                              value={student.last_name || ''}
                              onChange={(e) => {
                                // Update local state immediately for responsive UI
                                setStudents(prevStudents =>
                                  prevStudents.map(s =>
                                    s.id === student.id
                                      ? { ...s, last_name: e.target.value }
                                      : s
                                  )
                                );
                                setHasUnsavedChanges(true);
                              }}
                              className="w-50 h-8 rounded border border-gray-300 bg-white px-2 text-sm text-gray-800 outline-none focus:border-[#4A3B8D] focus:ring-1 focus:ring-[#4A3B8D]"
                              placeholder="Last name (optional)"
                            />
                            {/* Student Number and Gender Controls */}
                            {/* Student Number Input */}
                            <input
                              type="text"
                              inputMode="numeric"
                              value={student.student_number?.toString() || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Only allow numbers and empty string
                                if (value === '' || /^\d+$/.test(value)) {
                                  // Update local state immediately for responsive UI
                                  setStudents(prevStudents =>
                                    prevStudents.map(s =>
                                      s.id === student.id
                                        ? { ...s, student_number: value.trim() ? parseInt(value.trim(), 10) : null }
                                        : s
                                    )
                                  );
                                  setHasUnsavedChanges(true);
                                }
                              }}
                              className="w-20 h-8 rounded border border-gray-300 bg-white px-2 text-center text-sm text-gray-800 outline-none focus:border-[#4A3B8D] focus:ring-1 focus:ring-[#4A3B8D]"
                              placeholder="Number"
                            />
                            
                            {/* Gender Radio Buttons */}
                            <label 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleGenderToggle(student.id, 'Boy');
                              }}
                            >
                              <div className="relative">
                                <input
                                  type="radio"
                                  name={`gender-${student.id}`}
                                  checked={currentGender === 'Boy'}
                                  readOnly
                                  className="w-4 h-4 text-[#4A3B8D] focus:ring-[#4A3B8D] focus:ring-2 cursor-pointer pointer-events-none"
                                />
                              </div>
                              <span className="text-sm text-gray-700">Boy</span>
                            </label>
                            <label 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleGenderToggle(student.id, 'Girl');
                              }}
                            >
                              <div className="relative">
                                <input
                                  type="radio"
                                  name={`gender-${student.id}`}
                                  checked={currentGender === 'Girl'}
                                  readOnly
                                  className="w-4 h-4 text-[#4A3B8D] focus:ring-[#4A3B8D] focus:ring-2 cursor-pointer pointer-events-none"
                                />
                              </div>
                              <span className="text-sm text-gray-700">Girl</span>
                            </label>
                          </div>
                        </div>
                      );
                    })
                    )}
                  </div>
                  
                  {/* Fixed Footer with Save/Cancel Buttons */}
                  <div className="flex-shrink-0 flex justify-between items-center gap-3 pt-4 mt-4 border-t border-gray-200 bg-[#F5F5F5] pb-2">
                    <button
                      onClick={handleSwitchFirstAndLastNames}
                      disabled={isLoading || students.length === 0}
                      className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Switch First and Last Names
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelChanges}
                        disabled={isLoading || !hasUnsavedChanges}
                        className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAllChanges}
                        disabled={isLoading || !hasUnsavedChanges}
                        className="px-6 py-2 bg-[#D96B7B] text-white rounded-lg font-bold hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              {/* Add Teacher Section */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Add Teacher by Email
                </label>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    className="flex-1 h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                    placeholder="teacher@example.com"
                  />
                  <button
                    onClick={handleAddTeacher}
                    disabled={isLoading}
                    className="px-6 py-2 bg-[#D96B7B] text-white rounded-lg font-bold hover:brightness-95 transition disabled:opacity-50"
                  >
                    {isLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Teachers List */}
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Collaborating Teachers</h3>
                {teachers.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-600">No teachers are currently collaborating on this class.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#4A3B8D] rounded-full flex items-center justify-center text-white font-semibold">
                            {teacher.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-black">{teacher.name || teacher.email}</p>
                            <p className="text-sm text-gray-600">{teacher.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTeacher(teacher.email)}
                          disabled={isLoading}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Points Management</h3>
                <button
                  onClick={() => setShowResetPointsPopup(true)}
                  disabled={isResettingPoints}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                >
                  {isResettingPoints ? 'Resetting...' : 'Reset Points'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Students Modal */}
      <AddStudentsModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        classId={classId}
        onStudentAdded={async () => {
          await fetchStudents(); // Refresh the students list
          setIsAddStudentModalOpen(false);
          setHasUnsavedChanges(false); // Reset change tracking after adding
        }}
      />

      {/* Save Confirmation Modal */}
      <Modal
        isOpen={showSaveConfirmation}
        onClose={handleContinueEditing}
        className="max-w-md"
      >
        <div className="bg-[#F5F5F5] rounded-[28px] p-8 -m-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-extrabold text-[#4A3B8D] mb-2">
              Changes Saved Successfully!
            </h3>
            <p className="text-gray-600">
              All student information has been updated.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReturnToDashboard}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={handleContinueEditing}
              className="px-6 py-2 bg-[#D96B7B] text-white rounded-lg font-bold hover:brightness-95 transition"
            >
              Continue Editing Class Info
            </button>
          </div>
        </div>
      </Modal>

      {/* Validation Warning Modal */}
      <Modal
        isOpen={showValidationWarning}
        onClose={() => setShowValidationWarning(false)}
        className="max-w-md"
      >
        <div className="bg-[#F5F5F5] rounded-[28px] p-8 -m-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-extrabold text-[#4A3B8D] mb-2">
              Validation Warning
            </h3>
            <p className="text-gray-600 mb-4">
              One or more students are missing a first name. First name is required for all students.
            </p>
            {studentsWithoutFirstName.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-left max-h-60 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Students missing first name:
                </p>
                <ul className="space-y-1">
                  {studentsWithoutFirstName.map((student, index) => {
                    let identifier = '';
                    if (student.student_number) {
                      identifier = `Student #${student.student_number}`;
                      if (student.last_name) {
                        identifier += ` (${student.last_name})`;
                      }
                    } else if (student.last_name) {
                      identifier = student.last_name;
                    } else {
                      identifier = `Student ${index + 1}`;
                    }
                    return (
                      <li key={student.id || index} className="text-sm text-gray-600">
                        • {identifier}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowValidationWarning(false)}
              className="px-6 py-2 bg-[#D96B7B] text-white rounded-lg font-bold hover:brightness-95 transition"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Points Popup */}
      <Modal
        isOpen={showResetPointsPopup}
        onClose={() => setShowResetPointsPopup(false)}
        className="max-w-md"
      >
        <div className="bg-[#F5F5F5] rounded-[28px] p-8 -m-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-extrabold text-[#4A3B8D] mb-2">
              Reset Points
            </h3>
            <p className="text-gray-600 mb-4">
              Choose how you want to reset points for all students in this class:
            </p>
          </div>
          <div className="space-y-3 mb-6">
            <button
              onClick={async () => {
                await handleResetPoints(false); // Keep point events
              }}
              disabled={isResettingPoints}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="font-semibold mb-1">Option 1: Reset points but keep point events</div>
              <div className="text-sm opacity-90">Points will be set to 0, but all point event history will be preserved.</div>
            </button>
            <button
              onClick={async () => {
                await handleResetPoints(true); // Delete point events
              }}
              disabled={isResettingPoints}
              className="w-full px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="font-semibold mb-1">Option 2: Reset points and delete point events</div>
              <div className="text-sm opacity-90">Points will be set to 0 and all point event history will be permanently deleted.</div>
            </button>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowResetPointsPopup(false)}
              disabled={isResettingPoints}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

