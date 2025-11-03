'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import EditSkillModal from '@/components/modals/EditSkillModal';

interface PointCategory {
  id: string;
  name: string;
  default_points: number;
  class_id: string;
}

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  categories: PointCategory[];
  isLoading: boolean;
  refreshCategories: () => void;
}

export default function EditSkillsModal({
  isOpen,
  onClose,
  classId,
  categories,
  isLoading: isLoadingCategories,
  refreshCategories,
}: EditSkillsModalProps) {
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<PointCategory | null>(null);
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);

  // Filter categories into positive and negative skills
  const positiveSkills = useMemo(() => {
    return categories.filter((category) => {
      const points = (category as any).points ?? category.default_points;
      return points > 0;
    });
  }, [categories]);

  const negativeSkills = useMemo(() => {
    return categories.filter((category) => {
      const points = (category as any).points ?? category.default_points;
      return points < 0;
    });
  }, [categories]);

  // Get points value from category (support both points and default_points)
  const getPointsValue = (category: PointCategory): number => {
    return (category as any).points ?? category.default_points;
  };

  // Get skill icon
  const getSkillIcon = (skillName: string) => {
    return (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    );
  };

  // Get skill icon colors
  const getSkillColor = (skillName: string): string => {
    const colors = ['#EF4444', '#10B981', '#FBBF24', '#F97316', '#3B82F6', '#F59E0B', '#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < skillName.length; i++) {
      hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleDeleteSkill = async (skillId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    setIsDeleting(skillId);

    try {
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('You must be logged in to delete skills.');
        setIsDeleting(null);
        return;
      }

      // Delete the skill
      const { error } = await supabase
        .from('point_categories')
        .delete()
        .eq('id', skillId);

      if (error) {
        console.error('Error deleting skill:', error);
        alert('Failed to delete skill. Please try again.');
        setIsDeleting(null);
        return;
      }

      // Refresh categories to update the list
      refreshCategories();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditSkill = (skill: PointCategory) => {
    setEditingSkill(skill);
  };

  const filteredSkills = activeTab === 'positive' ? positiveSkills : negativeSkills;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="relative">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Edit or Remove Skills</h2>
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
              Negative
              {activeTab === 'negative' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
              )}
            </button>
          </div>

          {/* Skills Cards */}
          <div className="min-h-[300px]">
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading skills...</p>
                </div>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p>No {activeTab} skills found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {filteredSkills.map((category) => {
                  const pointsValue = getPointsValue(category);
                  const isPositive = pointsValue > 0;
                  const isDeletingThis = isDeleting === category.id;
                  const isHovered = hoveredSkillId === category.id;

                  return (
                    <div
                      key={category.id}
                      onClick={() => handleEditSkill(category)}
                      onMouseEnter={() => setHoveredSkillId(category.id)}
                      onMouseLeave={() => setHoveredSkillId(null)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer relative group min-h-[120px] flex items-center justify-center"
                    >
                      {isHovered ? (
                        // Show "Edit" text on hover
                        <div className="flex flex-col items-center">
                          <div className="text-purple-600 mb-2">
                            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-purple-600">Edit</span>
                        </div>
                      ) : (
                        // Show skill info normally
                        <div className="flex flex-col items-center text-center w-full">
                          <div className="mb-3" style={{ color: isPositive ? getSkillColor(category.name) : '#EF4444' }}>
                            {getSkillIcon(category.name)}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                          <span className={`text-xs font-medium absolute top-2 right-3 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}
                            {pointsValue}
                          </span>
                        </div>
                      )}
                      
                      {/* Delete button - always visible in corner */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSkill(category.id);
                        }}
                        disabled={isDeletingThis || isLoadingCategories}
                        className="absolute top-2 left-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                        title="Delete skill"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {isDeletingThis && (
                        <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center rounded-lg z-20">
                          <span className="text-sm text-gray-600">Deleting...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Skill Modal */}
      <EditSkillModal
        isOpen={editingSkill !== null}
        onClose={() => setEditingSkill(null)}
        skill={editingSkill}
        refreshCategories={refreshCategories}
      />
    </>
  );
}
