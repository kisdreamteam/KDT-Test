'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';

interface PointCategory {
  id: string;
  name: string;
  default_points: number;
  teacher_id: string;
  class_id: string;
}

interface ManageSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  categories: PointCategory[];
  isLoading: boolean;
  refreshCategories: () => void;
}

interface Skill {
  id: string;
  name: string;
  points: number;
  type: 'positive' | 'negative';
}

export default function ManageSkillsModal({ isOpen, onClose, classId, categories, isLoading: isLoadingCategories, refreshCategories }: ManageSkillsModalProps) {
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillName, setSkillName] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef<number>(1);

  // Convert categories to Skills format and filter by active tab
  const skills: Skill[] = categories.map(category => ({
    id: category.id,
    name: category.name,
    points: category.default_points,
    type: category.default_points > 0 ? 'positive' : 'negative',
  }));

  const filteredSkills = skills.filter(skill => skill.type === activeTab);

  // Reset form when tab changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      handleCancel();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!editingSkill) {
      // Reset points based on active tab when not editing
      const newValue = activeTab === 'positive' ? 1 : -1;
      setPoints(newValue);
      previousValueRef.current = newValue;
    }
  }, [activeTab, editingSkill]);

  const handleSave = async () => {
    if (!skillName.trim()) {
      alert('Please enter a skill name.');
      return;
    }

    const pointsValue = activeTab === 'positive' 
      ? Math.abs(points) 
      : -Math.abs(points);

    if (pointsValue === 0) {
      alert('Points cannot be zero. Please enter a valid point value.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('You must be logged in to save skills.');
        return;
      }

      if (editingSkill) {
        // Update existing skill
        const { error } = await supabase
          .from('point_categories')
          .update({
            name: skillName.trim(),
            default_points: pointsValue,
          })
          .eq('id', editingSkill.id)
          .eq('teacher_id', user.id);

        if (error) {
          console.error('Error updating skill:', error);
          alert('Failed to update skill. Please try again.');
          return;
        }
      } else {
        // Create new skill
        const { error } = await supabase
          .from('point_categories')
          .insert({
            name: skillName.trim(),
            default_points: pointsValue,
            teacher_id: user.id,
            class_id: classId,
          });

        if (error) {
          console.error('Error creating skill:', error);
          alert('Failed to create skill. Please try again.');
          return;
        }
      }

      // Refresh categories and reset form
      refreshCategories();
      handleCancel();
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSkillName('');
    const defaultValue = activeTab === 'positive' ? 1 : -1;
    setPoints(defaultValue);
    previousValueRef.current = defaultValue;
    setEditingSkill(null);
    onClose(); // Close the modal and return to the previous modal
  };

  const handleEdit = (skill: Skill) => {
    setActiveTab(skill.type);
    setEditingSkill(skill);
    setSkillName(skill.name);
    setPoints(skill.points); // Keep the actual value (positive or negative)
    previousValueRef.current = skill.points;
  };

  const handleDelete = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('You must be logged in to delete skills.');
        return;
      }

      const { error } = await supabase
        .from('point_categories')
        .delete()
        .eq('id', skillId)
        .eq('teacher_id', user.id);

      if (error) {
        console.error('Error deleting skill:', error);
        alert('Failed to delete skill. Please try again.');
        return;
      }

      // Refresh categories
      refreshCategories();
      
      // If we were editing this skill, reset the form
      if (editingSkill?.id === skillId) {
        handleCancel();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePointsChange = (value: number) => {
    let newValue: number;
    if (activeTab === 'positive') {
      // Only allow positive values
      newValue = Math.abs(value) || 1;
      setPoints(newValue);
    } else {
      // Only allow negative values, with -1 as the highest (least negative) value
      if (value >= 0) {
        // If positive or zero, convert to negative with minimum -1
        const absValue = Math.abs(value) || 1;
        newValue = -Math.max(1, absValue);
      } else {
        // Already negative, ensure it's at least -1 (most negative allowed is -1)
        // More negative values are allowed (like -2, -3, etc.)
        newValue = value;
      }
      setPoints(newValue);
    }
    previousValueRef.current = newValue;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="relative">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Manage Skills</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              // If editing a skill from different type, cancel edit first
              if (editingSkill && editingSkill.type !== 'positive') {
                handleCancel();
              }
              setActiveTab('positive');
              if (!editingSkill) {
                setPoints(1);
              } else if (editingSkill.type === 'positive') {
                setPoints(Math.abs(editingSkill.points));
              }
            }}
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
            onClick={() => {
              // If editing a skill from different type, cancel edit first
              if (editingSkill && editingSkill.type !== 'negative') {
                handleCancel();
              }
              setActiveTab('negative');
              if (!editingSkill) {
                setPoints(-1);
              } else if (editingSkill.type === 'negative') {
                setPoints(editingSkill.points); // Keep the actual negative value
              }
            }}
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

        {/* Add/Edit Form */}
        <div className="mb-8 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingSkill ? 'Edit Skill' : 'Add New Skill'}
          </h3>

          <div className="space-y-4">
            {/* Skill Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Name
              </label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Helping others"
                disabled={isLoading}
              />
            </div>

            {/* Points Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                min={activeTab === 'positive' ? 1 : undefined}
                step="1"
                value={points}
                ref={inputRef}
                onChange={(e) => {
                  const numValue = Number(e.target.value);
                  if (isNaN(numValue)) {
                    // If empty or invalid, set default based on tab
                    const defaultValue = activeTab === 'positive' ? 1 : -1;
                    setPoints(defaultValue);
                    previousValueRef.current = defaultValue;
                    if (inputRef.current) {
                      inputRef.current.value = defaultValue.toString();
                    }
                  } else {
                    // Check if this change might be from a spinner button click
                    if (activeTab === 'negative' && previousValueRef.current !== undefined) {
                      const diff = numValue - previousValueRef.current;
                      // Spinner buttons change value by exactly step (1)
                      if (Math.abs(diff) === 1) {
                        if (diff > 0) {
                          // Spinner UP clicked - native tries to go less negative
                          // We want inverted: make it MORE negative instead
                          const currentAbs = Math.abs(previousValueRef.current);
                          const newValue = -(currentAbs + 1);
                          setPoints(newValue);
                          previousValueRef.current = newValue;
                          if (inputRef.current) {
                            inputRef.current.value = newValue.toString();
                          }
                          return;
                        } else {
                          // Spinner DOWN clicked - native tries to go more negative
                          // Check if we're at -1 already (can't go less negative)
                          if (previousValueRef.current <= -1) {
                            // Allow going more negative
                            handlePointsChange(numValue);
                            previousValueRef.current = numValue;
                            return;
                          }
                        }
                      }
                      // If value is >= 0 or > -1, it's invalid for negative tab
                      if (numValue >= 0 || numValue > -1) {
                        // Reset to -1 (the minimum allowed negative value)
                        setPoints(-1);
                        previousValueRef.current = -1;
                        if (inputRef.current) {
                          inputRef.current.value = '-1';
                        }
                        return;
                      }
                    }
                    handlePointsChange(numValue);
                    previousValueRef.current = numValue;
                  }
                }}
                onKeyDown={(e) => {
                  if (activeTab === 'negative') {
                    // Invert arrow key behavior for negative tab
                    const currentAbs = Math.abs(points);
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      // Make more negative (increase absolute value: -1 -> -2 -> -3, etc.)
                      handlePointsChange(-(currentAbs + 1));
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      // Make less negative (decrease absolute value, but not below 1: -3 -> -2 -> -1)
                      if (currentAbs > 1) {
                        handlePointsChange(-(currentAbs - 1));
                      }
                    }
                  }
                }}
                onWheel={(e) => {
                  // Handle mouse wheel on the input for negative tab
                  if (activeTab === 'negative' && document.activeElement === e.currentTarget) {
                    e.preventDefault();
                    const currentAbs = Math.abs(points);
                    if (e.deltaY < 0) {
                      // Scroll up - make more negative
                      handlePointsChange(-(currentAbs + 1));
                    } else {
                      // Scroll down - make less negative
                      if (currentAbs > 1) {
                        handlePointsChange(-(currentAbs - 1));
                      }
                    }
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={activeTab === 'positive' ? 'e.g., 5' : 'e.g., -2'}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'positive' 
                  ? 'Only positive values are allowed.' 
                  : 'Only negative values are allowed. Use up arrow to increase penalty.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Skill'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Skills List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Manage Existing Skills
          </h3>

          <div className="space-y-3">
            {isLoadingCategories ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p>Loading skills...</p>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No skills to edit. Please add a skill.</p>
              </div>
            ) : (
              filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <span
                        className={`text-sm font-medium ${
                          skill.type === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {skill.type === 'positive' ? '+' : ''}
                        {skill.points}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(skill)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
