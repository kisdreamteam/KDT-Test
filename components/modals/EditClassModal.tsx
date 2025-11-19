'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';
import AddStudentsModal from '@/components/modals/AddStudentsModal';

interface Class {
  id: string;
  name: string;
  grade: string;
  school_year: string;
  teacher_id: string;
  icon?: string;
}

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
  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'teachers' | 'settings'>('info');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('/images/dashboard/icons/icon-1.png');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<StudentWithPhoto[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Generate array of all available icons
  const availableIcons = Array.from({ length: 15 }, (_, i) => 
    `/images/dashboard/icons/icon-${i + 1}.png`
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

  // Fetch class data
  useEffect(() => {
    if (isOpen && classId) {
      fetchClassData();
      fetchStudents();
      fetchTeachers();
    }
  }, [isOpen, classId]);

  const fetchClassData = async () => {
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
        setSelectedIcon(data.icon || '/images/dashboard/icons/icon-1.png');
      }
    } catch (err) {
      console.error('Unexpected error fetching class:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const supabase = createClient();
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, avatar, student_number, gender, class_id, points')
        .eq('class_id', classId)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
        return;
      }

      if (studentsData) {
        setStudents(studentsData as StudentWithPhoto[]);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err);
      setStudents([]);
    }
  };

  const fetchTeachers = async () => {
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
  };

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
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                      placeholder="Enter grade"
                    />
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
            <div>
              {isLoadingData ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3B8D] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
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

                  {/* Students List */}
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No students in this class yet.</p>
                    </div>
                  ) : (
                    students.map((student) => {
                      const imageSrc = student.avatar || "/images/students/avatars/student_avatar_1.png";
                      return (
                        <div
                          key={student.id}
                          className="w-full flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 flex-shrink-0">
                            <Image
                              src={imageSrc}
                              alt={`${student.first_name} ${student.last_name}`}
                              width={40}
                              height={40}
                              className="rounded-full object-cover w-10 h-10"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-800 flex-1">
                            {student.first_name} {student.last_name}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
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
            <div className="text-center py-16">
              <p className="text-gray-600">Settings options will be available here in the future.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Students Modal */}
      <AddStudentsModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        classId={classId}
        onStudentAdded={() => {
          fetchStudents(); // Refresh the students list
          setIsAddStudentModalOpen(false);
        }}
      />
    </Modal>
  );
}

