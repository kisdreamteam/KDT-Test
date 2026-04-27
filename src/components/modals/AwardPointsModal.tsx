'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '@/components/modals/Modal';
import AddSkillModal from '@/components/modals/AddSkillModal';
import EditSkillsModal from '@/components/modals/EditSkillsModal';
import { PointCategory, Student } from '@/lib/types';
import {
  fetchPointCategoriesByClassIds,
  fetchStudentIdsByClassId,
  fetchStudentIdsByClassIds,
  awardPointsToStudents,
  getAuthenticatedUserId,
  awardCustomPointsToStudents,
} from '@/api/points';

// Helper function to add cache-busting parameter to icon URLs
// Uses modal open state to generate a fresh cache-busting parameter
const addCacheBuster = (iconPath: string, cacheKey?: string | number): string => {
  if (!iconPath) return iconPath;
  // Add cache-busting parameter to force fresh image fetch
  // Use provided cacheKey or generate one based on current time
  const separator = iconPath.includes('?') ? '&' : '?';
  const version = cacheKey || Date.now();
  return `${iconPath}${separator}v=${version}`;
};

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
  
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positive' | 'negative' | 'custom'>('positive');
  const [customPoints, setCustomPoints] = useState<number>(0);
  const [customMemo, setCustomMemo] = useState<string>('');
  const [isManageSkillsModalOpen, setManageSkillsModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [imageCacheKey, setImageCacheKey] = useState<number>(Date.now());

  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    if (!isOpen) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // For multi-class mode, fetch categories from all selected classes
      // For other modes, use the single classId
      const classIdsToFetch = (selectedClassIds && selectedClassIds.length > 0)
        ? selectedClassIds 
        : [classId];

      const data = await fetchPointCategoriesByClassIds(classIdsToFetch);

      // Normalize icon paths for categories (convert old paths to new paths)
      const normalizedData = (data || []).map((category: any) => ({
        ...category,
        icon: category.icon?.includes('/images/classes/icons/icon-pos-')
          ? category.icon.replace('/images/classes/icons/icon-pos-', '/images/dashboard/award-points-icons/icons-positive/icon-pos-')
          : category.icon?.includes('/images/classes/icons/icon-neg-')
          ? category.icon.replace('/images/classes/icons/icon-neg-', '/images/dashboard/award-points-icons/icons-negative/icon-neg-')
          : category.icon
      }));

      // For multi-class mode, we might have duplicate categories, so we'll use unique ones
      // For now, we'll just use all categories (they should be class-specific anyway)
      setCategories(normalizedData);
    } catch (err) {
      console.error('Unexpected error fetching categories:', err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, classId, selectedClassIds]);

  // Fetch categories when modal opens or classId/selectedClassIds changes
  useEffect(() => {
    if (isOpen) {
      // Update cache key when modal opens to force fresh image loads
      setImageCacheKey(Date.now());
      fetchCategories();
    }
  }, [isOpen, classId, selectedClassIds, fetchCategories]);

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
    return filtered;
  }, [categories]);


  const resolveTargetStudentIds = useCallback(async (): Promise<string[]> => {
    if (isMultiClassMode && selectedClassIds) {
      return fetchStudentIdsByClassIds(selectedClassIds);
    }
    if (isMultiStudentMode && selectedStudentIds) {
      return selectedStudentIds;
    }
    if (isWholeClassMode) {
      return fetchStudentIdsByClassId(classId);
    }
    if (student) {
      return [student.id];
    }
    return [];
  }, [isMultiClassMode, selectedClassIds, isMultiStudentMode, selectedStudentIds, isWholeClassMode, classId, student]);

  const afterAwardSuccess = useCallback((pointsValue: number, categoryName: string, categoryIcon?: string) => {
    if (isMultiClassMode && selectedClassIds && onAwardComplete) {
      onAwardComplete(selectedClassIds, 'classes');
    }
    if (isMultiStudentMode && selectedStudentIds && onAwardComplete) {
      onAwardComplete(selectedStudentIds, 'students');
    }

    if (onRefresh) {
      onRefresh();
    }

    if (onPointsAwarded) {
      if (isMultiStudentMode && selectedStudentIds) {
        onPointsAwarded({
          studentAvatar: classIcon || '/images/dashboard/student-avatars/avatar-01.png',
          studentFirstName: `${selectedStudentIds.length} ${selectedStudentIds.length === 1 ? 'Student' : 'Students'}`,
          points: pointsValue,
          categoryName,
          categoryIcon,
        });
      } else if (isWholeClassMode) {
        onPointsAwarded({
          studentAvatar: classIcon || '/images/dashboard/student-avatars/avatar-01.png',
          studentFirstName: className || 'Whole Class',
          points: pointsValue,
          categoryName,
          categoryIcon,
        });
      } else if (student) {
        onPointsAwarded({
          studentAvatar: student.avatar || '/images/dashboard/student-avatars/avatar-01.png',
          studentFirstName: student.first_name,
          points: pointsValue,
          categoryName,
          categoryIcon,
        });
      }
    }

    onClose();
  }, [isMultiClassMode, selectedClassIds, onAwardComplete, isMultiStudentMode, selectedStudentIds, onRefresh, onPointsAwarded, classIcon, isWholeClassMode, className, student, onClose]);

  // Handle awarding points for a skill/category
  const handleAwardSkill = async (category: PointCategory) => {
    try {
      const points = category.points ?? category.default_points ?? 0;
      const studentIds = await resolveTargetStudentIds();
      if (studentIds.length === 0) {
        alert('No students found for the current selection.');
        return;
      }

      await awardPointsToStudents({
        studentIds,
        categoryId: category.id,
        points,
        memo: '',
      });

      afterAwardSuccess(points, category.name, category.icon);
    } catch (err) {
      console.error('Unexpected error awarding points:', err);
      alert('Failed to award points. Please try again.');
    }
  };

  // Handle custom points submission
  const handleCustomAward = async () => {
    if (customPoints === 0 || customPoints === null || customPoints === undefined || isNaN(customPoints)) {
      alert('Please enter a valid point value (positive or negative, but not zero).');
      return;
    }

    try {
      const teacherId = await getAuthenticatedUserId();
      if (!teacherId) {
        alert('You must be logged in to award custom points.');
        return;
      }

      const studentIds = await resolveTargetStudentIds();
      if (studentIds.length === 0) {
        alert('No students found for the current selection.');
        return;
      }

      await awardCustomPointsToStudents({
        studentIds,
        teacherId,
        points: customPoints,
        memo: customMemo,
      });

      setCustomPoints(0);
      setCustomMemo('');
      afterAwardSuccess(customPoints, customMemo || 'Custom Points');
    } catch (err) {
      console.error('Unexpected error awarding custom points:', err);
      alert('Failed to award custom points. Please try again.');
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
              <img
                src={isMultiClassMode || isWholeClassMode
                  ? (classIcon || "/images/dashboard/class-icons/icon-1.png")
                  : (student?.avatar || "/images/dashboard/student-avatars/avatar-01.png")
                }
                alt={student
                  ? `${student.first_name} ${student.last_name}`
                  : isMultiClassMode && selectedClassIds
                  ? `${selectedClassIds.length} Selected Classes`
                  : isMultiStudentMode && selectedStudentIds
                  ? `${selectedStudentIds.length} Selected Students`
                  : isWholeClassMode 
                  ? (className || "Whole Class")
                  : ''
                }
                width={48}
                height={48}
                className="rounded-full"
                decoding="async"
              />
              {/* Crown icon overlay - only for single student (including single student from seating chart) */}
              {(student || (!isWholeClassMode && !isMultiClassMode && !isMultiStudentMode)) && (
                <div className="absolute -top-1 -right-1">
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L8.5 8.5 2 9.5l5 5-1 7 6-3.5 6 3.5-1-7 5-5-6.5-1L12 2z"/>
                  </svg>
                </div>
              )}
            </div>
            <span className="text-5xl font-bold text-gray-900">
              {student
                ? `${student.first_name} ${student.last_name}`
                : isMultiClassMode && selectedClassIds
                ? `${selectedClassIds.length} Selected ${selectedClassIds.length === 1 ? 'Class' : 'Classes'}`
                : isMultiStudentMode && selectedStudentIds
                ? `${selectedStudentIds.length} Selected ${selectedStudentIds.length === 1 ? 'Student' : 'Students'}`
                : isWholeClassMode 
                ? (className || 'Whole Class')
                : ''
              }
            </span>
            
            {/* Point Totals */}
            <div className="flex items-left gap-2 ml-4">
              <span className="px-0 py-1 rounded-full text-3xl font-bold text-red-600 translate-y-2/12">
                {student
                  ? `${student.points || 0} Points`
                  : isMultiClassMode || isMultiStudentMode
                  ? 'Multiple'
                  : isWholeClassMode 
                  ? 'Class Points'
                  : '0 Points'
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
                        className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-6 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col"
                      >
                        {/* Skill Icon */}
                        <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                          {skill.icon ? (
                            <img
                              key={`${skill.id}-${imageCacheKey}`}
                              src={addCacheBuster(skill.icon, imageCacheKey)}
                              alt={skill.name}
                              width={100}
                              height={100}
                              className="rounded-xl bg-[#FDF2F0] object-contain"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-[100px] h-[100px] rounded-xl bg-[#FDF2F0] flex items-center justify-center">
                              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Skill Name */}
                        <div className="text-center mb-0 pointer-events-none flex-shrink-0">
                          <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                        </div>
                        {/* Points Badge */}
                        <div className="text-center pointer-events-none mt-auto">
                          <div className="inline-flex items-center px-3 py-0 rounded-full bg-[#FDF2F0] text-red-400 text-xl font-large font-bold">
                            +{skill.points}
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
                        className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-6 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col"
                      >
                        {/* Skill Icon */}
                        <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
                          {skill.icon ? (
                            <img
                              key={`${skill.id}-${imageCacheKey}`}
                              src={addCacheBuster(skill.icon, imageCacheKey)}
                              alt={skill.name}
                              width={100}
                              height={100}
                              className="rounded-xl bg-[#FDF2F0] object-contain"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-[100px] h-[100px] rounded-xl bg-[#FDF2F0] flex items-center justify-center">
                              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Skill Name */}
                        <div className="text-center mb-0 pointer-events-none flex-shrink-0">
                          <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                        </div>
                        {/* Points Badge */}
                        <div className="text-center pointer-events-none mt-auto">
                          <div className="inline-flex items-center px-3 py-0 rounded-full bg-[#FDF2F0] text-red-400 text-xl font-large font-bold">
                            {skill.points}
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
