'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { PointCategory } from '@/lib/types';

interface EditSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: PointCategory | null;
  refreshCategories: () => void;
}

export default function EditSkillModal({ isOpen, onClose, skill, refreshCategories }: EditSkillModalProps) {
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [skillName, setSkillName] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef<number>(1);

  // Populate form when skill data is available
  useEffect(() => {
    if (skill) {
      const pointsValue = skill.points ?? skill.default_points ?? 0;
      setSkillName(skill.name);
      setPoints(pointsValue);
      previousValueRef.current = pointsValue;
      setActiveTab(pointsValue > 0 ? 'positive' : 'negative');
    }
  }, [skill]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen && skill) {
      const pointsValue = skill.points ?? skill.default_points ?? 0;
      setSkillName(skill.name);
      setPoints(pointsValue);
      previousValueRef.current = pointsValue;
      setActiveTab(pointsValue > 0 ? 'positive' : 'negative');
    }
  }, [isOpen, skill]);

  useEffect(() => {
    // Only auto-reset points if we're changing tabs and the current skill doesn't match
    if (skill) {
      const pointsValue = skill.points ?? skill.default_points ?? 0;
      const currentType = pointsValue > 0 ? 'positive' : 'negative';
      if (activeTab !== currentType) {
        const newValue = activeTab === 'positive' ? 1 : -1;
        setPoints(newValue);
        previousValueRef.current = newValue;
      }
    }
  }, [activeTab, skill]);

  const handleUpdateSkill = async () => {
    if (!skill) return;

    console.log('=== handleUpdateSkill called ===');
    console.log('Form state - skillName:', skillName);
    console.log('Form state - points:', points);
    console.log('Form state - activeTab:', activeTab);

    // Validation
    if (!skillName.trim()) {
      console.log('Validation failed: skillName is empty');
      alert('Please enter a skill name.');
      return;
    }

    // Get form values
    const name = skillName.trim();
    const pointsValue = activeTab === 'positive' 
      ? Math.abs(points) 
      : -Math.abs(points);

    console.log('Processed values - name:', name);
    console.log('Processed values - pointsValue:', pointsValue);

    if (pointsValue === 0) {
      console.log('Validation failed: pointsValue is zero');
      alert('Points cannot be zero. Please enter a valid point value.');
      return;
    }

    setIsLoading(true);

    try {
      // Initialize Supabase client
      const supabase = createClient();
      console.log('Supabase client initialized');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User fetch - user:', user ? { id: user.id, email: user.email } : null);
      console.log('User fetch - error:', userError);

      if (userError || !user) {
        console.error('Authentication failed:', userError);
        alert('You must be logged in to update skills.');
        setIsLoading(false);
        return;
      }

      // Update skill in Supabase
      const { error } = await supabase
        .from('point_categories')
        .update({
          name: name,
          points: pointsValue,
        })
        .eq('id', skill.id);

      if (error) {
        console.error('=== Error updating skill ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        alert('Failed to update skill. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('=== Skill updated successfully ===');
      console.log('Updated skill ID:', skill.id);
      console.log('Updated values:', { name, points: pointsValue });

      // Refresh categories on success
      refreshCategories();
      
      // Close modal
      setIsLoading(false);
      onClose();
      
      console.log('=== handleUpdateSkill completed successfully ===');
    } catch (error) {
      console.error('=== Unexpected error in handleUpdateSkill ===');
      console.error('Error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('Loading state set to false');
    }
  };

  const handleCancel = () => {
    if (skill) {
      const pointsValue = skill.points ?? skill.default_points ?? 0;
      setSkillName(skill.name);
      setPoints(pointsValue);
      previousValueRef.current = pointsValue;
      setActiveTab(pointsValue > 0 ? 'positive' : 'negative');
    }
    onClose();
  };

  const handlePointsChange = (value: number) => {
    let newValue: number;
    if (activeTab === 'positive') {
      // Only allow positive values
      newValue = Math.abs(value) || 1;
      setPoints(newValue);
    } else {
      // Only allow negative values
      if (value >= 0) {
        // If positive or zero, convert to negative with minimum -1
        const absValue = Math.abs(value) || 1;
        newValue = -Math.max(1, absValue);
      } else {
        // Already negative
        newValue = value;
      }
      setPoints(newValue);
    }
    previousValueRef.current = newValue;
  };

  if (!skill) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="relative">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Skill</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('positive');
              setPoints(1);
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
              setActiveTab('negative');
              setPoints(-1);
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

        {/* Edit Skill Form */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Edit Skill
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
                    const defaultValue = activeTab === 'positive' ? 1 : -1;
                    setPoints(defaultValue);
                    previousValueRef.current = defaultValue;
                    if (inputRef.current) {
                      inputRef.current.value = defaultValue.toString();
                    }
                  } else {
                    if (activeTab === 'negative' && previousValueRef.current !== undefined) {
                      const diff = numValue - previousValueRef.current;
                      if (Math.abs(diff) === 1) {
                        if (diff > 0) {
                          const currentAbs = Math.abs(previousValueRef.current);
                          const newValue = -(currentAbs + 1);
                          setPoints(newValue);
                          previousValueRef.current = newValue;
                          if (inputRef.current) {
                            inputRef.current.value = newValue.toString();
                          }
                          return;
                        } else {
                          if (previousValueRef.current <= -1) {
                            handlePointsChange(numValue);
                            previousValueRef.current = numValue;
                            return;
                          }
                        }
                      }
                      if (numValue >= 0 || numValue > -1) {
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
                    const currentAbs = Math.abs(points);
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      handlePointsChange(-(currentAbs + 1));
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (currentAbs > 1) {
                        handlePointsChange(-(currentAbs - 1));
                      }
                    }
                  }
                }}
                onWheel={(e) => {
                  if (activeTab === 'negative' && document.activeElement === e.currentTarget) {
                    e.preventDefault();
                    const currentAbs = Math.abs(points);
                    if (e.deltaY < 0) {
                      handlePointsChange(-(currentAbs + 1));
                    } else {
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
                onClick={handleUpdateSkill}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

