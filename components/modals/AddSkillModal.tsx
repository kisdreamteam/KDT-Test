'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { PointCategory } from '@/lib/types';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  categories: PointCategory[];
  isLoading: boolean;
  refreshCategories: () => void;
  skillType?: 'positive' | 'negative'; // Determines which type of skill can be added
}

export default function AddSkillModal({ isOpen, onClose, classId, categories, isLoading: isLoadingCategories, refreshCategories, skillType = 'positive' }: AddSkillModalProps) {
  const [skillName, setSkillName] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef<number>(1);
  const isHandlingSpinnerRef = useRef<boolean>(false);

  // Reset form when modal closes or skillType changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setSkillName('');
      const newValue = skillType === 'positive' ? 1 : -1;
      setPoints(newValue);
      previousValueRef.current = newValue;
    } else {
      // When modal opens, set points based on skillType
      const newValue = skillType === 'positive' ? 1 : -1;
      setPoints(newValue);
      previousValueRef.current = newValue;
    }
  }, [isOpen, skillType]);

  useEffect(() => {
    // Reset points based on skillType
    const newValue = skillType === 'positive' ? 1 : -1;
    setPoints(newValue);
    previousValueRef.current = newValue;
  }, [skillType]);

  const handleAddSkill = async () => {
    console.log('=== handleAddSkill called ===');
    console.log('Form state - skillName:', skillName);
    console.log('Form state - points:', points);
    console.log('Form state - skillType:', skillType);
    console.log('Form state - classId:', classId);

    // Validation
    if (!skillName.trim()) {
      console.log('Validation failed: skillName is empty');
      alert('Please enter a skill name.');
      return;
    }

    // Get form values
    const name = skillName.trim();
    const pointsValue = skillType === 'positive' 
      ? Math.abs(points) 
      : -Math.abs(points);
    const type = skillType; // Type determined by skillType prop

    console.log('Processed values - name:', name);
    console.log('Processed values - pointsValue:', pointsValue);
    console.log('Processed values - type:', type);

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
        alert('You must be logged in to add skills.');
        setIsLoading(false);
        return;
      }

      // Create new skill object for debugging (matches what will be inserted)
      const newSkill = {
        name: name, // 'name' from your form state
        points: points, // 'points' from your form state
        type: type, // 'type' from your form state
        class_id: classId // 'classId' from your props
      };

      console.log('Data to insert for new skill:', newSkill);

      // Insert into Supabase
      const { error } = await supabase.from('point_categories').insert(newSkill);

      if (error) {
        console.error('=== Error adding skill ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        alert('Failed to add skill. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('=== Skill added successfully ===');
      console.log('Refreshing categories...');

      // Refresh categories on success
      refreshCategories();
      
      // Show success modal instead of immediately clearing form
      setIsLoading(false);
      setShowSuccessModal(true);
      
      console.log('=== handleAddSkill completed successfully ===');
    } catch (error) {
      console.error('=== Unexpected error in handleAddSkill ===');
      console.error('Error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('Loading state set to false');
    }
  };

  const handleCancel = () => {
    setSkillName('');
    // Reset points based on skillType
    const newValue = skillType === 'positive' ? 1 : -1;
    setPoints(newValue);
    previousValueRef.current = newValue;
    onClose(); // Close the modal and return to the previous modal
  };

  const handlePointsChange = (value: number) => {
    let newValue: number;
    if (skillType === 'positive') {
      // Only allow positive values
      newValue = Math.abs(value) || 1;
      setPoints(newValue);
    } else {
      // Only allow negative values, with -1 as the maximum (least negative) value
      if (value >= 0) {
        // If positive or zero, convert to -1
        newValue = -1;
      } else {
        // Already negative, ensure it's at most -1 (can't go less negative than -1)
        newValue = Math.max(-1, value);
      }
      setPoints(newValue);
    }
    previousValueRef.current = newValue;
  };

  const handleAddAnotherSkill = () => {
    // Clear form fields for another entry
    setSkillName('');
    const newValue = skillType === 'positive' ? 1 : -1;
    setPoints(newValue);
    previousValueRef.current = newValue;
    setShowSuccessModal(false);
  };

  const handleReturn = () => {
    // Close success modal and return to Award Points modal
    setShowSuccessModal(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="relative">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Skill</h2>
        </div>

        {/* Add Skill Form */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Add New Skill
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
              {skillType === 'negative' ? (
                // Custom input with buttons for negative tab
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={points}
                    ref={inputRef}
                    onChange={(e) => {
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue)) {
                        setPoints(-1);
                        previousValueRef.current = -1;
                      } else if (numValue >= 0 || numValue > -1) {
                        setPoints(-1);
                        previousValueRef.current = -1;
                      } else {
                        handlePointsChange(numValue);
                        previousValueRef.current = numValue;
                      }
                    }}
                    onKeyDown={(e) => {
                      // Invert arrow key behavior for negative tab
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        // Up arrow decreases value (makes more negative: -1 -> -2 -> -3, etc.)
                        handlePointsChange(points - 1);
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        // Down arrow increases value (makes less negative, but max is -1: -3 -> -2 -> -1)
                        if (points < -1) {
                          handlePointsChange(points + 1);
                        }
                      }
                    }}
                    onWheel={(e) => {
                      // Handle mouse wheel on the input for negative tab
                      if (document.activeElement === e.currentTarget) {
                        e.preventDefault();
                        if (e.deltaY < 0) {
                          // Scroll up - decrease value (make more negative: -1 -> -2 -> -3)
                          handlePointsChange(points - 1);
                        } else {
                          // Scroll down - increase value (make less negative, but max is -1: -3 -> -2 -> -1)
                          if (points < -1) {
                            handlePointsChange(points + 1);
                          }
                        }
                      }
                    }}
                    className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., -2"
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        // Up arrow: decrease value (make more negative: -1 -> -2)
                        const newValue = points - 1;
                        setPoints(newValue);
                        previousValueRef.current = newValue;
                      }}
                      className="px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-t border border-gray-300 border-b-0"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Down arrow: increase value (make less negative: -2 -> -1, max -1)
                        if (points < -1) {
                          const newValue = points + 1;
                          setPoints(newValue);
                          previousValueRef.current = newValue;
                        }
                      }}
                      className="px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-b border border-gray-300"
                      disabled={isLoading || points >= -1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                // Regular input for positive tab
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={points}
                  ref={inputRef}
                  onChange={(e) => {
                    const numValue = Number(e.target.value);
                    if (isNaN(numValue)) {
                      const defaultValue = 1;
                      setPoints(defaultValue);
                      previousValueRef.current = defaultValue;
                    } else {
                      handlePointsChange(numValue);
                      previousValueRef.current = numValue;
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 5"
                  disabled={isLoading}
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {skillType === 'positive' 
                  ? 'Only positive values are allowed.' 
                  : 'Only negative values are allowed. Maximum value is -1. Up arrow decreases value, down arrow increases value.'}
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
                onClick={handleAddSkill}
                disabled={isLoading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Skill'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    {/* Success Modal */}
    <Modal isOpen={showSuccessModal} onClose={handleReturn} className="max-w-md">
      <div className="text-center py-6">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          New skill added successfully!
        </h3>
        <p className="text-gray-600 mb-6">
          Your skill has been saved and is now available for use.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleAddAnotherSkill}
            className="px-6 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            Add Another Skill
          </button>
          <button
            onClick={handleReturn}
            className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Return
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
}

