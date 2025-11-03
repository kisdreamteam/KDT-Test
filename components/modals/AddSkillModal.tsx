'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';

interface PointCategory {
  id: string;
  name: string;
  default_points: number;
  class_id: string;
}

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  categories: PointCategory[];
  isLoading: boolean;
  refreshCategories: () => void;
}

export default function AddSkillModal({ isOpen, onClose, classId, categories, isLoading: isLoadingCategories, refreshCategories }: AddSkillModalProps) {
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [skillName, setSkillName] = useState<string>('');
  const [points, setPoints] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef<number>(1);

  // Reset form when tab changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      handleCancel();
    } else {
      // When modal opens, ensure positive tab is active
      setActiveTab('positive');
      setPoints(1);
      previousValueRef.current = 1;
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset points based on active tab
    const newValue = activeTab === 'positive' ? 1 : -1;
    setPoints(newValue);
    previousValueRef.current = newValue;
  }, [activeTab]);

  const handleAddSkill = async () => {
    console.log('=== handleAddSkill called ===');
    console.log('Form state - skillName:', skillName);
    console.log('Form state - points:', points);
    console.log('Form state - activeTab:', activeTab);
    console.log('Form state - classId:', classId);

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
    const type = activeTab; // Type determined by active tab

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
    setActiveTab('positive'); // Reset to positive tab
    setPoints(1);
    previousValueRef.current = 1;
    onClose(); // Close the modal and return to the previous modal
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

  const handleAddAnotherSkill = () => {
    // Clear form fields for another entry and reset to positive tab
    setSkillName('');
    setActiveTab('positive');
    setPoints(1);
    previousValueRef.current = 1;
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

