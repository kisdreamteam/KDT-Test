'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/modals/Modal';
import { createClient } from '@/lib/supabase/client';
import EditSkillModal from '@/components/modals/EditSkillModal';
import { PointCategory } from '@/lib/types';
import Image from 'next/image';

interface EditSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  categories: PointCategory[];
  isLoading: boolean;
  refreshCategories: () => void;
  skillType?: 'positive' | 'negative'; // Optional prop to filter skills by type
}

export default function EditSkillsModal({
  isOpen,
  onClose,
  classId,
  categories,
  isLoading: isLoadingCategories,
  refreshCategories,
  skillType,
}: EditSkillsModalProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<PointCategory | null>(null);
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<PointCategory | null>(null);

  // Filter categories into positive and negative skills
  const positiveSkills = useMemo(() => {
    return categories.filter((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return points > 0;
    });
  }, [categories]);

  const negativeSkills = useMemo(() => {
    return categories.filter((category) => {
      const points = category.points ?? category.default_points ?? 0;
      return points < 0;
    });
  }, [categories]);

  // Get points value from category (support both points and default_points)
  const getPointsValue = (category: PointCategory): number => {
    return category.points ?? category.default_points ?? 0;
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

  const handleDeleteClick = (skill: PointCategory) => {
    // Show confirmation modal
    setSkillToDelete(skill);
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;

    const skillId = skillToDelete.id;
    setIsDeleting(skillId);
    // Keep confirmation modal open during deletion to show loading state

    try {
      const supabase = createClient();
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('You must be logged in to delete skills.');
        setIsDeleting(null);
        setSkillToDelete(null); // Close confirmation modal
        return;
      }

      // Verify the skill belongs to this class before deleting
      // This ensures security and correct deletion
      const { data: skillData, error: fetchError } = await supabase
        .from('point_categories')
        .select('class_id')
        .eq('id', skillId)
        .single();

      if (fetchError || !skillData) {
        console.error('Error verifying skill:', fetchError);
        alert('Failed to verify skill. Please try again.');
        setIsDeleting(null);
        setSkillToDelete(null);
        return;
      }

      // Verify the skill belongs to the current class
      if (skillData.class_id !== classId) {
        alert('This skill does not belong to the current class.');
        setIsDeleting(null);
        setSkillToDelete(null);
        return;
      }

      // Delete the skill from database
      // Since skills are linked to class_id, deleting removes it for all students in that class
      const { error } = await supabase
        .from('point_categories')
        .delete()
        .eq('id', skillId)
        .eq('class_id', classId); // Extra safety check

      if (error) {
        console.error('Error deleting skill:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more specific error message
        let errorMessage = 'Failed to delete skill. Please try again.';
        if (error.code === '23503') {
          errorMessage = 'Cannot delete skill because it is being used by students. Please remove all student awards for this skill first.';
        } else if (error.message) {
          errorMessage = `Failed to delete skill: ${error.message}`;
        }
        
        alert(errorMessage);
        setIsDeleting(null);
        setSkillToDelete(null); // Close confirmation modal
        return;
      }

      console.log('Skill successfully deleted:', skillId);

      // Successfully deleted - refresh categories to update the list
      refreshCategories();
      
      // Close confirmation modal and return user to EditSkills modal
      setSkillToDelete(null);
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
      setSkillToDelete(null); // Close confirmation modal
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCancelDelete = () => {
    setSkillToDelete(null);
  };

  const handleEditSkill = (skill: PointCategory) => {
    setEditingSkill(skill);
  };

  // Filter skills based on skillType prop (if provided) or show all
  const filteredSkills = useMemo(() => {
    if (skillType === 'positive') {
      return positiveSkills;
    } else if (skillType === 'negative') {
      return negativeSkills;
    }
    // If no skillType specified, show all skills (for backwards compatibility)
    return [...positiveSkills, ...negativeSkills];
  }, [skillType, positiveSkills, negativeSkills]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="relative">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Edit or Remove {skillType === 'positive' ? 'Positive' : skillType === 'negative' ? 'Negative' : ''} Skills
            </h2>
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
                <p>No {skillType === 'positive' ? 'positive' : skillType === 'negative' ? 'negative' : ''} skills found.</p>
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
                            {category.icon ? (
                              <Image
                                src={category.icon}
                                alt={category.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              getSkillIcon(category.name)
                            )}
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
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(category);
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

      {/* Delete Confirmation Modal - rendered outside EditSkills modal to ensure proper z-index */}
      {skillToDelete && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          {/* Semi-transparent background overlay */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={handleCancelDelete}
          />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full mx-4 max-w-md">
            {/* Close button */}
            <button
              type="button"
              onClick={handleCancelDelete}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            {/* Modal content */}
            <div className="p-6 text-center py-6">
              {isDeleting && skillToDelete && isDeleting === skillToDelete.id ? (
                // Show loading state during deletion
                <div>
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                  <p className="text-gray-600">Deleting skill...</p>
                </div>
              ) : (
                // Show confirmation message
                <>
                  {/* Warning Icon */}
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <svg
                      className="h-8 w-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>

                  {/* Confirmation Message */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Delete Skill?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this skill?
                    <span className="block mt-2 font-medium text-gray-900">
                      &quot;{skillToDelete.name}&quot;
                    </span>
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      disabled={isDeleting !== null}
                      className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={isDeleting !== null}
                      className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Yes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
