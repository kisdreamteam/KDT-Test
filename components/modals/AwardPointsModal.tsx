'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import AddSkillModal from '@/components/modals/AddSkillModal';
import EditSkillsModal from '@/components/modals/EditSkillsModal';
import { PointCategory, Student } from '@/lib/types';

interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classId: string;
  onRefresh?: () => void;
}

export default function AwardPointsModal({
  isOpen,
  onClose,
  student,
  classId,
  onRefresh,
}: AwardPointsModalProps) {
  console.log('AWARD POINTS MODAL: classId received:', classId);
  
  const [categories, setCategories] = useState<PointCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positive' | 'negative' | 'custom'>('positive');
  const [customPoints, setCustomPoints] = useState<number>(0);
  const [customMemo, setCustomMemo] = useState<string>('');
  const [isManageSkillsModalOpen, setManageSkillsModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // Fetch categories function
  const fetchCategories = async () => {
    if (!isOpen) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('point_categories')
        .select('*')
        .eq('class_id', classId);

      console.log('AWARD POINTS MODAL: Fetched categories data:', data);
      console.error('AWARD POINTS MODAL: Fetched categories error:', error);

      if (error) {
        console.error('Error fetching categories:', error?.message || error);
        setCategories([]);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching categories:', err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories when modal opens or classId changes
  useEffect(() => {
    fetchCategories();
  }, [isOpen, classId]);

  // Debug logging for categories and loading state
  useEffect(() => {
    console.log('AWARD POINTS MODAL: categories array length:', categories.length);
    console.log('AWARD POINTS MODAL: isLoading state:', isLoading);
    console.log('AWARD POINTS MODAL: categories data:', categories);
  }, [categories, isLoading]);

  // Filter categories into positive and negative skills
  const positiveSkills = useMemo(() => {
    const filtered = categories.filter((category) => {
      // Check both possible property names
      const points = category.points ?? category.default_points ?? 0;
      return points > 0;
    }).map((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return {
        id: category.id,
        name: category.name,
        points: points,
        icon: getSkillIcon(category.name),
      };
    });
    console.log('Filtered positive skills:', filtered.length, filtered);
    return filtered;
  }, [categories]);

  const negativeSkills = useMemo(() => {
    const filtered = categories.filter((category) => {
      // Check both possible property names
      const points = category.points ?? category.default_points ?? 0;
      return points < 0;
    }).map((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return {
        id: category.id,
        name: category.name,
        points: points,
        icon: getSkillIcon(category.name),
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
        // Close the modal
        onClose();
      }
    } catch (err) {
      console.error('Unexpected error awarding points:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  // Handle custom points submission
  const handleCustomAward = async () => {
    // Validate custom points
    if (!customPoints || customPoints === 0) {
      alert('Please enter a valid point value.');
      return;
    }

    try {
      const supabase = createClient();
      
      const { error } = await supabase.rpc('award_points_to_student', {
        student_id_in: student.id,
        category_id_in: null,
        points_in: customPoints,
        memo_in: customMemo || ''
      });

      if (error) {
        console.error('Error awarding custom points:', error);
        alert('Failed to award points. Please try again.');
      } else {
        // Reset custom form
        setCustomPoints(0);
        setCustomMemo('');
        // Refresh the student list if onRefresh is provided
        if (onRefresh) {
          onRefresh();
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
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="relative">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          {/* Student Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={student.avatar || "/images/students/avatars/student_avatar_1.png"}
                alt={`${student.first_name} ${student.last_name}`}
                width={48}
                height={48}
                className="rounded-full"
              />
              {/* Crown icon overlay */}
              <div className="absolute -top-1 -right-1">
                <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L8.5 8.5 2 9.5l5 5-1 7 6-3.5 6 3.5-1-7 5-5-6.5-1L12 2z"/>
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-900 lowercase">{student.first_name} {student.last_name}</span>
            
            {/* Point Totals */}
            <div className="flex items-center gap-2 ml-4">
              <span className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm text-gray-700">
                (0) Points
              </span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                (89) CLASS
              </span>
              <span className="px-3 py-1 bg-yellow-400 text-white rounded-full text-sm font-medium">
                (100) Grade
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('positive')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'positive'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Positive
            {activeTab === 'positive' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('negative')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'negative'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Needs work
            {activeTab === 'negative' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'custom'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Points
            {activeTab === 'custom' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
            )}
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
                <div className="grid grid-cols-3 gap-4">
                  {positiveSkills.map((skill) => {
                    // Find the full category object
                    const category = categories.find(cat => cat.id === skill.id);
                    if (!category) return null;
                    
                    return (
                      <div
                        key={skill.id}
                        onClick={() => handleAwardSkill(category)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-3" style={{ color: getSkillColor(skill.name) }}>
                            {skill.icon}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">{skill.name}</h3>
                          <span className="text-xs font-medium text-gray-700 absolute top-2 right-3">
                            +{skill.points}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add Skills Card */}
                  <button
                    onClick={() => setManageSkillsModalOpen(true)}
                    className="bg-white rounded-lg border-2 border-purple-500 border-dashed p-4 hover:border-purple-600 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
                  >
                    <div className="text-purple-500 mb-2">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-purple-600">Add skills</span>
                  </button>
                  {/* Edit Skills Card */}
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="bg-white rounded-lg border-2 border-gray-300 border-dashed p-4 hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
                  >
                    <div className="text-gray-600 mb-2">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Edit Skills</span>
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
                <div className="grid grid-cols-3 gap-4">
                  {negativeSkills.map((skill) => {
                    // Find the full category object
                    const category = categories.find(cat => cat.id === skill.id);
                    if (!category) return null;
                    
                    return (
                      <div
                        key={skill.id}
                        onClick={() => handleAwardSkill(category)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-3 text-red-500">
                            {skill.icon}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">{skill.name}</h3>
                          <span className="text-xs font-medium text-gray-700 absolute top-2 right-3">
                            {skill.points}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add Skills Card */}
                  <button
                    onClick={() => setManageSkillsModalOpen(true)}
                    className="bg-white rounded-lg border-2 border-purple-500 border-dashed p-4 hover:border-purple-600 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
                  >
                    <div className="text-purple-500 mb-2">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-purple-600">Add skills</span>
                  </button>
                  {/* Edit Skills Card */}
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="bg-white rounded-lg border-2 border-gray-300 border-dashed p-4 hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
                  >
                    <div className="text-gray-600 mb-2">
                      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-600">Edit Skills</span>
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
                  value={customPoints || ''}
                  onChange={(e) => setCustomPoints(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter point value"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Memo (optional)
                </label>
                <textarea
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
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
        categories={categories}
        isLoading={isLoading}
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
function getSkillIcon(skillName: string): React.ReactNode {
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
