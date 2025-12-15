'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Modal from '@/components/modals/Modal';
import { createClient } from '@/lib/supabase/client';
import AddSkillModal from '@/components/modals/AddSkillModal';
import EditSkillsModal from '@/components/modals/EditSkillsModal';
import { PointCategory, Student } from '@/lib/types';

interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; // null for whole class mode or multi-select mode
  classId: string; // Single classId for backward compatibility
  className?: string; // For whole class mode
  classIcon?: string; // For whole class mode
  onRefresh?: () => void;
  onPointsAwarded?: (awardInfo: {
    studentAvatar: string;
    studentFirstName: string;
    points: number;
    categoryName: string;
    categoryIcon?: string;
  }) => void;
  // Multi-select support
  selectedClassIds?: string[]; // For multi-class selection
  selectedStudentIds?: string[]; // For multi-student selection
  onAwardComplete?: (selectedIds: string[], type: 'classes' | 'students') => void; // Callback to store selected IDs
}

export default function AwardPointsModal({
  isOpen,
  onClose,
  student,
  classId,
  className,
  classIcon,
  onRefresh,
  onPointsAwarded,
  selectedClassIds,
  selectedStudentIds,
  onAwardComplete,
}: AwardPointsModalProps) {
  const isMultiClassMode = selectedClassIds && selectedClassIds.length > 0;
  const isMultiStudentMode = selectedStudentIds && selectedStudentIds.length > 0;
  const isWholeClassMode = student === null && !isMultiClassMode && !isMultiStudentMode;
  console.log('AWARD POINTS MODAL: classId received:', classId);
  
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positive' | 'negative' | 'custom'>('positive');
  const [customPoints, setCustomPoints] = useState<number>(0);
  const [customMemo, setCustomMemo] = useState<string>('');
  const [isManageSkillsModalOpen, setManageSkillsModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    if (!isOpen) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // For multi-class mode, fetch categories from all selected classes
      // For other modes, use the single classId
      const classIdsToFetch = (selectedClassIds && selectedClassIds.length > 0)
        ? selectedClassIds 
        : [classId];

      const { data, error } = await supabase
        .from('point_categories')
        .select('*')
        .in('class_id', classIdsToFetch);

      console.log('AWARD POINTS MODAL: Fetched categories data:', data);

      if (error) {
        console.error('AWARD POINTS MODAL: Fetched categories error:', error);
        console.error('Error fetching categories:', error?.message || error);
        setCategories([]);
      } else {
        // For multi-class mode, we might have duplicate categories, so we'll use unique ones
        // For now, we'll just use all categories (they should be class-specific anyway)
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching categories:', err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, classId, selectedClassIds]);

  // Fetch categories when modal opens or classId/selectedClassIds changes
  useEffect(() => {
    fetchCategories();
  }, [isOpen, classId, selectedClassIds, fetchCategories]);

  // Debug logging for categories and loading state
  useEffect(() => {
    console.log('AWARD POINTS MODAL: categories array length:', categories.length);
    console.log('AWARD POINTS MODAL: isLoading state:', isLoading);
    console.log('AWARD POINTS MODAL: categories data:', categories);
  }, [categories, isLoading]);

  // Filter categories into positive and negative skills
  const positiveSkills = useMemo(() => {
    const filtered = categories.filter((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return points > 0;
    }).map((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return {
        id: category.id,
        name: category.name,
        points: points,
        icon: category.icon, // Use icon from database
      };
    });
    console.log('Filtered positive skills:', filtered.length, filtered);
    return filtered;
  }, [categories]);

  const negativeSkills = useMemo(() => {
    const filtered = categories.filter((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return points < 0;
    }).map((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return {
        id: category.id,
        name: category.name,
        points: points,
        icon: category.icon, // Use icon from database
      };
    });
    console.log('Filtered negative skills:', filtered.length, filtered);
    return filtered;
  }, [categories]);


  // Handle awarding points for a skill/category
  const handleAwardSkill = async (category: PointCategory) => {
    try {
      const supabase = createClient();
      const points = category.points ?? category.default_points ?? 0;
      
      if (isMultiClassMode && selectedClassIds) {
        // Award points to all students in all selected classes
        const { data: students, error: fetchError } = await supabase
          .from('students')
          .select('id')
          .in('class_id', selectedClassIds);

        if (fetchError) {
          console.error('Error fetching students:', fetchError);
          alert('Failed to fetch students. Please try again.');
          return;
        }

        if (!students || students.length === 0) {
          alert('No students found in the selected classes.');
          return;
        }

        // Award points to each student
        const awardPromises = students.map(async (s) => {
          const { error } = await supabase.rpc('award_points_to_student', {
            student_id_in: s.id,
            category_id_in: category.id,
            points_in: points,
            memo_in: '' // Empty memo for a standard skill click
          });
          return error;
        });

        const errors = await Promise.all(awardPromises);
        const hasError = errors.some(err => err !== null);

        if (hasError) {
          console.error('Error awarding skill points to some students:', errors);
          alert('Failed to award points to some students. Please try again.');
          return;
        }

        // Store selected class IDs in localStorage and notify parent
        if (onAwardComplete) {
          onAwardComplete(selectedClassIds, 'classes');
        }

        // Refresh if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Close the modal
        onClose();
      } else if (isMultiStudentMode && selectedStudentIds) {
        // Award points to selected students
        const awardPromises = selectedStudentIds.map(async (studentId) => {
          const { error } = await supabase.rpc('award_points_to_student', {
            student_id_in: studentId,
            category_id_in: category.id,
            points_in: points,
            memo_in: '' // Empty memo for a standard skill click
          });
          return error;
        });

        const errors = await Promise.all(awardPromises);
        const hasError = errors.some(err => err !== null);

        if (hasError) {
          console.error('Error awarding skill points to some students:', errors);
          alert('Failed to award points to some students. Please try again.');
          return;
        }

        // Store selected student IDs in localStorage and notify parent
        if (onAwardComplete) {
          onAwardComplete(selectedStudentIds, 'students');
        }

        // Notify parent about the award for multiple students
        if (onPointsAwarded) {
          onPointsAwarded({
            studentAvatar: classIcon || "/images/classes/avatars/avatar-01.png",
            studentFirstName: `${selectedStudentIds.length} ${selectedStudentIds.length === 1 ? 'Student' : 'Students'}`,
            points: points,
            categoryName: category.name,
            categoryIcon: category.icon,
          });
        }

        // Refresh if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Close the modal
        onClose();
      } else if (isWholeClassMode) {
        // Award points to all students in the class
        const { data: students, error: fetchError } = await supabase
          .from('students')
          .select('id')
          .eq('class_id', classId);

        if (fetchError) {
          console.error('Error fetching students:', fetchError);
          alert('Failed to fetch students. Please try again.');
          return;
        }

        if (!students || students.length === 0) {
          alert('No students found in this class.');
          return;
        }

        // Award points to each student
        const awardPromises = students.map(async (s) => {
          const { error } = await supabase.rpc('award_points_to_student', {
            student_id_in: s.id,
            category_id_in: category.id,
            points_in: points,
            memo_in: '' // Empty memo for a standard skill click
          });
          return error;
        });

        const errors = await Promise.all(awardPromises);
        const hasError = errors.some(err => err !== null);

        if (hasError) {
          console.error('Error awarding skill points to some students:', errors);
          alert('Failed to award points to some students. Please try again.');
          return;
        }

        // Refresh the student list if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Notify parent about the award
        if (onPointsAwarded) {
          onPointsAwarded({
            studentAvatar: classIcon || "/images/classes/avatars/avatar-01.png",
            studentFirstName: className || 'Whole Class',
            points: points,
            categoryName: category.name,
            categoryIcon: category.icon,
          });
        }
        
        // Close the modal
        onClose();
      } else {
        // Single student mode
        if (!student) return;
        
        const { error } = await supabase.rpc('award_points_to_student', {
          student_id_in: student.id,
          category_id_in: category.id,
          points_in: points,
          memo_in: '' // Empty memo for a standard skill click
        });

        if (error) {
          console.error('Error awarding skill points:', error);
          alert('Failed to award points. Please try again.');
        } else {
          // Refresh the student list if onRefresh is provided
          if (onRefresh) {
            onRefresh();
          }
          
          // Notify parent about the award
          if (onPointsAwarded) {
            onPointsAwarded({
              studentAvatar: student.avatar || "/images/classes/avatars/avatar-01.png",
              studentFirstName: student.first_name,
              points: points,
              categoryName: category.name,
              categoryIcon: category.icon,
            });
          }
          
          // Close the modal
          onClose();
        }
      }
    } catch (err) {
      console.error('Unexpected error awarding points:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Handle custom points submission
  const handleCustomAward = async () => {
    // Validate custom points - allow positive or negative, but not zero or empty
    if (customPoints === 0 || customPoints === null || customPoints === undefined || isNaN(customPoints)) {
      alert('Please enter a valid point value (positive or negative, but not zero).');
      return;
    }

    try {
      const supabase = createClient();
      
      // Get current authenticated user (required for teacher_id and RLS policy)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        alert('You must be logged in to award custom points.');
        return;
      }
      
      if (isMultiClassMode && selectedClassIds) {
        // Award custom points to all students in all selected classes
        const { data: students, error: fetchError } = await supabase
          .from('students')
          .select('id, points')
          .in('class_id', selectedClassIds);

        if (fetchError) {
          console.error('Error fetching students:', fetchError);
          alert('Failed to fetch students. Please try again.');
          return;
        }

        if (!students || students.length === 0) {
          alert('No students found in the selected classes.');
          return;
        }

        // Insert custom point events for each student
        const insertPromises = students.map(async (s) => {
          const { error: insertError } = await supabase
            .from('custom_point_events')
            .insert({
              student_id: s.id,
              teacher_id: user.id,
              points: customPoints,
              memo: customMemo || null
            });
          
          if (insertError) {
            return insertError;
          }

          // Update student's total points
          const currentPoints = s.points || 0;
          const newPoints = currentPoints + customPoints;
          
          const { error: updateError } = await supabase
            .from('students')
            .update({ points: newPoints })
            .eq('id', s.id);

          return updateError;
        });

        const errors = await Promise.all(insertPromises);
        const hasError = errors.some(err => err !== null);

        if (hasError) {
          console.error('Error awarding custom points to some students:', errors);
          alert('Failed to award points to some students. Please try again.');
          return;
        }

        // Store selected class IDs in localStorage and notify parent
        if (onAwardComplete) {
          onAwardComplete(selectedClassIds, 'classes');
        }

        // Success - reset form
        setCustomPoints(0);
        setCustomMemo('');
        // Refresh if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Close the modal
        onClose();
      } else if (isMultiStudentMode && selectedStudentIds) {
        // Award custom points to selected students
        const { data: students, error: fetchError } = await supabase
          .from('students')
          .select('id, points')
          .in('id', selectedStudentIds);

        if (fetchError) {
          console.error('Error fetching students:', fetchError);
          alert('Failed to fetch students. Please try again.');
          return;
        }

        if (!students || students.length === 0) {
          alert('No students found.');
          return;
        }

        // Insert custom point events for each student
        const insertPromises = students.map(async (s) => {
          const { error: insertError } = await supabase
            .from('custom_point_events')
            .insert({
              student_id: s.id,
              teacher_id: user.id,
              points: customPoints,
              memo: customMemo || null
            });
          
          if (insertError) {
            return insertError;
          }

          // Update student's total points
          const currentPoints = s.points || 0;
          const newPoints = currentPoints + customPoints;
          
          const { error: updateError } = await supabase
            .from('students')
            .update({ points: newPoints })
            .eq('id', s.id);

          return updateError;
        });

        const errors = await Promise.all(insertPromises);
        const hasError = errors.some(err => err !== null);

        if (hasError) {
          console.error('Error awarding custom points to some students:', errors);
          alert('Failed to award points to some students. Please try again.');
          return;
        }

        // Store selected student IDs in localStorage and notify parent
        if (onAwardComplete) {
          onAwardComplete(selectedStudentIds, 'students');
        }

        // Notify parent about the award for multiple students (custom points)
        if (onPointsAwarded) {
          onPointsAwarded({
            studentAvatar: classIcon || "/images/classes/avatars/avatar-01.png",
            studentFirstName: `${selectedStudentIds.length} ${selectedStudentIds.length === 1 ? 'Student' : 'Students'}`,
            points: customPoints,
            categoryName: customMemo || 'Custom Points',
            categoryIcon: undefined, // No icon for custom points
          });
        }

        // Success - reset form
        setCustomPoints(0);
        setCustomMemo('');
        // Refresh if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Close the modal
        onClose();
      } else if (isWholeClassMode) {
        // Award custom points to all students in the class
        const { data: students, error: fetchError } = await supabase
          .from('students')
          .select('id, points')
          .eq('class_id', classId);

        if (fetchError) {
          console.error('Error fetching students:', fetchError);
          alert('Failed to fetch students. Please try again.');
          return;
        }

        if (!students || students.length === 0) {
          alert('No students found in this class.');
          return;
        }

        // Insert custom point events for each student
        const insertPromises = students.map(async (s) => {
          const { error: insertError } = await supabase
            .from('custom_point_events')
            .insert({
              student_id: s.id,
              teacher_id: user.id,
              points: customPoints,
              memo: customMemo || null
            });
          
          if (insertError) {
            return insertError;
          }

          // Update student's total points
          const currentPoints = s.points || 0;
          const newPoints = currentPoints + customPoints;
          
          const { error: updateError } = await supabase
            .from('students')
            .update({ points: newPoints })
            .eq('id', s.id);

          return updateError;
        });

        const errors = await Promise.all(insertPromises);
        const hasError = errors.some(err => err !== null);

        if (hasError) {
          console.error('Error awarding custom points to some students:', errors);
          alert('Failed to award points to some students. Please try again.');
          return;
        }

        // Success - reset form and notify
        setCustomPoints(0);
        setCustomMemo('');
        // Refresh the student list if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Notify parent about the award (custom points)
        if (onPointsAwarded) {
          onPointsAwarded({
            studentAvatar: classIcon || "/images/classes/avatars/avatar-01.png",
            studentFirstName: className || 'Whole Class',
            points: customPoints,
            categoryName: customMemo || 'Custom Points',
            categoryIcon: undefined, // No icon for custom points
          });
        }
        
        // Close the modal
        onClose();
      } else {
        // Single student mode
        if (!student) return;
        
        // Insert directly into custom_point_events table
        const { error: insertError } = await supabase
          .from('custom_point_events')
          .insert({
            student_id: student.id,
            teacher_id: user.id, // Required for RLS policy and foreign key
            points: customPoints,
            memo: customMemo || null
          });

        if (insertError) {
          console.error('Error inserting custom points into custom_point_events:', insertError);
          console.error('Error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          alert(`Failed to award custom points: ${insertError.message || 'Please try again.'}`);
          return;
        }

        // Update student's total points
        const currentPoints = student.points || 0;
        const newPoints = currentPoints + customPoints;
        
        const { error: updateError } = await supabase
          .from('students')
          .update({ points: newPoints })
          .eq('id', student.id);

        if (updateError) {
          console.error('Error updating student points:', updateError);
          alert('Points were recorded but failed to update student total. Please refresh the page.');
          return;
        }

        // Success - reset form and notify
        setCustomPoints(0);
        setCustomMemo('');
        // Refresh the student list if onRefresh is provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Notify parent about the award (custom points)
        if (onPointsAwarded) {
          onPointsAwarded({
            studentAvatar: student.avatar || "/images/classes/avatars/avatar-01.png",
            studentFirstName: student.first_name,
            points: customPoints,
            categoryName: customMemo || 'Custom Points',
            categoryIcon: undefined, // No icon for custom points
          });
        }
        
        // Close the modal
        onClose();
      }
    } catch (err) {
      console.error('Unexpected error awarding custom points:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl" fixedTop={true}>
        <div className={`relative p-6 rounded-lg transition-colors ${
          activeTab === 'positive' 
            ? 'bg-blue-100' 
            : activeTab === 'negative' 
            ? 'bg-pink-100' 
            : activeTab === 'custom'
            ? 'bg-orange-100'
            : 'bg-white'
        }`}>
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          {/* Student/Class Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={isMultiClassMode || isWholeClassMode
                  ? (classIcon || "/images/1Landing Page Image.png")
                  : (student?.avatar || "/images/classes/avatars/avatar-01.png")
                }
                alt={isMultiClassMode && selectedClassIds
                  ? `${selectedClassIds.length} Selected Classes`
                  : isMultiStudentMode && selectedStudentIds
                  ? `${selectedStudentIds.length} Selected Students`
                  : isWholeClassMode 
                  ? (className || "Whole Class")
                  : `${student?.first_name} ${student?.last_name}`
                }
                width={48}
                height={48}
                className="rounded-full"
              />
              {/* Crown icon overlay - only for single student */}
              {!isWholeClassMode && !isMultiClassMode && !isMultiStudentMode && (
                <div className="absolute -top-1 -right-1">
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L8.5 8.5 2 9.5l5 5-1 7 6-3.5 6 3.5-1-7 5-5-6.5-1L12 2z"/>
                  </svg>
                </div>
              )}
            </div>
            <span className="text-5xl font-bold text-gray-900">
              {isMultiClassMode && selectedClassIds
                ? `${selectedClassIds.length} Selected ${selectedClassIds.length === 1 ? 'Class' : 'Classes'}`
                : isMultiStudentMode && selectedStudentIds
                ? `${selectedStudentIds.length} Selected ${selectedStudentIds.length === 1 ? 'Student' : 'Students'}`
                : isWholeClassMode 
                ? (className || 'Whole Class')
                : `${student?.first_name} ${student?.last_name}`
              }
            </span>
            
            {/* Point Totals */}
            <div className="flex items-left gap-2 ml-4">
              <span className="px-0 py-1 rounded-full text-3xl font-bold text-red-600 translate-y-2/12">
                {isMultiClassMode || isMultiStudentMode
                  ? 'Multiple'
                  : isWholeClassMode 
                  ? 'Class Points'
                  : `${student?.points || 0} Points`
                }
              </span>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-4 md:gap-6 mb-6">
          <button
            onClick={() => setActiveTab('positive')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 font-semibold text-xs sm:text-sm md:text-base transition-colors flex items-center justify-center ${
              activeTab === 'positive'
                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm'
                : 'bg-white text-gray-400 hover:bg-pink-50 hover:shadow-sm'
            }`}
          >
            Positive
          </button>
          <button
            onClick={() => setActiveTab('negative')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 font-semibold text-xs sm:text-sm md:text-base transition-colors flex items-center justify-center ${
              activeTab === 'negative'
                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm'
                : 'bg-white text-gray-400 hover:bg-pink-50 hover:shadow-sm'
            }`}
          >
            Needs work
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 font-semibold text-xs sm:text-sm md:text-base transition-colors flex items-center justify-center ${
              activeTab === 'custom'
                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-sm'
                : 'bg-white text-gray-400 hover:bg-pink-50 hover:shadow-sm'
            }`}
          >
            Custom Points
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* Positive Tab */}
          {activeTab === 'positive' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading categories...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {positiveSkills.map((skill) => {
                    // Find the full category object
                    const category = categories.find(cat => cat.id === skill.id);
                    if (!category) return null;
                    
                    return (
                      <div
                        key={skill.id}
                        onClick={() => handleAwardSkill(category)}
                        className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-4 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col"
                      >
                        <div className="flex flex-col items-center text-center flex-1">
                          {/* Skill Icon */}
                          <div className="flex justify-center mb-3 pointer-events-none flex-shrink-0">
                            <div className="rounded-xl bg-[#FDF2F0] p-2 flex items-center justify-center" style={{ color: getSkillColor(skill.name) }}>
                              {skill.icon ? (
                                <Image
                                  src={skill.icon}
                                  alt={skill.name}
                                  width={60}
                                  height={60}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Skill Name */}
                          <div className="text-center mb-0.5 pointer-events-none flex-shrink-0">
                            <h3 className="text-sm font-semibold text-gray-900">{skill.name}</h3>
                          </div>
                          {/* Points Badge */}
                          <div className="text-center pointer-events-none mt-auto">
                            <div className="inline-flex items-center px-2 py-1 rounded-full bg-[#FDF2F0] text-red-400 text-base font-bold">
                              +{skill.points}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add Skills Card */}
                  <button
                    onClick={() => setManageSkillsModalOpen(true)}
                    className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-4 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col border-2 border-purple-500 border-dashed hover:border-purple-600"
                  >
                    <div className="flex flex-col items-center justify-center flex-1">
                      <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                        <div className="rounded-xl bg-[#FDF2F0] p-2 flex items-center justify-center text-purple-500">
                          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </div>
                      </div>
                      <div className="text-center mb-1 pointer-events-none flex-shrink-0">
                        <h3 className="text-sm font-semibold text-purple-600">Add skills</h3>
                      </div>
                    </div>
                  </button>
                  {/* Edit Skills Card */}
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-4 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col border-2 border-gray-300 border-dashed hover:border-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center flex-1">
                      <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                        <div className="rounded-xl bg-[#FDF2F0] p-2 flex items-center justify-center text-gray-600">
                          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-center mb-1 pointer-events-none flex-shrink-0">
                        <h3 className="text-sm font-semibold text-gray-600">Edit Skills</h3>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Negative Tab (Needs work) */}
          {activeTab === 'negative' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading categories...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {negativeSkills.map((skill) => {
                    // Find the full category object
                    const category = categories.find(cat => cat.id === skill.id);
                    if (!category) return null;
                    
                    return (
                      <div
                        key={skill.id}
                        onClick={() => handleAwardSkill(category)}
                        className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-4 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col"
                      >
                        <div className="flex flex-col items-center text-center flex-1">
                          {/* Skill Icon */}
                          <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                            <div className="rounded-xl bg-[#FDF2F0] p-2 flex items-center justify-center text-red-500">
                              {skill.icon ? (
                                <Image
                                  src={skill.icon}
                                  alt={skill.name}
                                  width={60}
                                  height={60}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Skill Name */}
                          <div className="text-center mb-1 pointer-events-none flex-shrink-0">
                            <h3 className="text-sm font-semibold text-gray-900">{skill.name}</h3>
                          </div>
                          {/* Points Badge */}
                          <div className="text-center pointer-events-none mt-auto">
                            <div className="inline-flex items-center px-2 py-1 rounded-full bg-[#FDF2F0] text-red-400 text-base font-bold">
                              {skill.points}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add Skills Card */}
                  <button
                    onClick={() => setManageSkillsModalOpen(true)}
                    className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-4 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col border-2 border-purple-500 border-dashed hover:border-purple-600"
                  >
                    <div className="flex flex-col items-center justify-center flex-1">
                      <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                        <div className="rounded-xl bg-[#FDF2F0] p-2 flex items-center justify-center text-purple-500">
                          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                          </svg>
                        </div>
                      </div>
                      <div className="text-center mb-1 pointer-events-none flex-shrink-0">
                        <h3 className="text-sm font-semibold text-purple-600">Add skills</h3>
                      </div>
                    </div>
                  </button>
                  {/* Edit Skills Card */}
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-4 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col border-2 border-gray-300 border-dashed hover:border-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center flex-1">
                      <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                        <div className="rounded-xl bg-[#FDF2F0] p-2 flex items-center justify-center text-gray-600">
                          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-center mb-1 pointer-events-none flex-shrink-0">
                        <h3 className="text-sm font-semibold text-gray-600">Edit Skills</h3>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Custom Points Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Point Value
                </label>
                <input
                  type="number"
                  value={customPoints === 0 ? '' : customPoints}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string for clearing the input
                    if (value === '' || value === '-') {
                      setCustomPoints(0);
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue)) {
                        setCustomPoints(numValue);
                      }
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter point value (positive or negative)"
                />
                <p className="text-xs text-gray-500">
                  Enter a positive or negative point value. Zero is not allowed.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Memo (optional)
                </label>
                <textarea
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                  placeholder="Add a note about these points..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCustomAward}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Submit Points
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </Modal>
      
      {/* Add Skills Modal */}
      <AddSkillModal 
        isOpen={isManageSkillsModalOpen} 
        onClose={() => setManageSkillsModalOpen(false)} 
        classId={classId}
        refreshCategories={fetchCategories}
        skillType={activeTab === 'positive' ? 'positive' : activeTab === 'negative' ? 'negative' : 'positive'}
      />

      {/* Edit Skills Modal */}
      <EditSkillsModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        classId={classId}
        categories={categories}
        isLoading={isLoading}
        refreshCategories={fetchCategories}
        skillType={activeTab === 'positive' ? 'positive' : activeTab === 'negative' ? 'negative' : undefined}
      />
    </>
  );
}

// Helper function to generate an icon based on skill name
function getSkillIcon(): React.ReactNode {
  // Default icon for all skills (can be customized based on name if needed)
  return (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  );
}

// Helper function to get skill icon colors
function getSkillColor(skillName: string): string {
  // Default colors - can be customized based on skill name
  const colors = ['#EF4444', '#10B981', '#FBBF24', '#F97316', '#3B82F6', '#F59E0B', '#8B5CF6'];
  // Simple hash function to assign consistent colors
  let hash = 0;
  for (let i = 0; i < skillName.length; i++) {
    hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
