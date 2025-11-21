'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { Student } from '@/lib/types';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onRefresh: () => void;
}

export default function EditStudentModal({ isOpen, onClose, student, onRefresh }: EditStudentModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [gender, setGender] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('/images/classes/avatars/avatar-01.png');
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Generate array of available student avatars (avatar-01.png through avatar-40.png)
  const availableAvatars = Array.from({ length: 40 }, (_, i) => {
    const number = String(i + 1).padStart(2, '0');
    return `/images/classes/avatars/avatar-${number}.png`;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    };

    if (isAvatarDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAvatarDropdownOpen]);

  // Load student data when modal opens
  useEffect(() => {
    if (isOpen && student) {
      setFirstName(student.first_name || '');
      setLastName(student.last_name || '');
      // Convert number to string for input field
      setStudentNumber(student.student_number?.toString() || '');
      setSelectedAvatar(student.avatar || '/images/classes/avatars/avatar-01.png');
      setGender(student.gender || '');
      setIsLoadingData(false);
    } else if (!isOpen) {
      // Reset form when modal closes
      setFirstName('');
      setLastName('');
      setStudentNumber('');
      setGender('');
      setSelectedAvatar('/images/classes/avatars/avatar-01.png');
      setIsLoadingData(true);
    }
  }, [isOpen, student]);

  const handleSave = async () => {
    if (!student) return;

    if (!firstName.trim()) {
      alert('Please enter a first name.');
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      // Convert student_number string to number or null
      const studentNumberValue = studentNumber.trim() 
        ? parseInt(studentNumber.trim(), 10) 
        : null;
      
      // Validate that if provided, it's a valid number
      if (studentNumber.trim() && isNaN(studentNumberValue as number)) {
        alert('Please enter a valid student number.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('students')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          student_number: studentNumberValue,
          gender: gender.trim() || null,
          avatar: selectedAvatar
        })
        .eq('id', student.id);

      if (error) {
        console.error('Error updating student:', error);
        alert('Failed to update student. Please try again.');
        return;
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error('Unexpected error updating student:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="bg-[#F5F5F5] rounded-[28px] p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-[#4A3B8D] mb-2">Edit Student</h2>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A3B8D] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading student data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar Picker */}
            <div className="flex justify-center mb-6">
              <div className="relative" ref={dropdownRef}>
                {/* Selected Avatar Display (Clickable) */}
                <button
                  type="button"
                  onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-gray-300 hover:border-[#4A3B8D] relative shadow-sm"
                >
                  <Image
                    src={selectedAvatar}
                    alt="Student avatar"
                    width={60}
                    height={60}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Fallback to default avatar if image doesn't exist
                      e.currentTarget.src = '/images/classes/avatars/avatar-01.png';
                    }}
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


                {/* Avatar Dropdown */}
                {isAvatarDropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsAvatarDropdownOpen(false)}
                    />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20 w-80 max-h-96 overflow-y-auto">
                      <div className="text-sm font-semibold text-gray-700 mb-3 text-center">
                        Choose Student Avatar
                      </div>
                      
                      {/* Avatars Grid */}
                      <div className="grid grid-cols-5 gap-3">
                        {availableAvatars.map((avatar, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSelectedAvatar(avatar);
                              setIsAvatarDropdownOpen(false);
                            }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 overflow-hidden ${
                              selectedAvatar === avatar
                                ? 'border-[#4A3B8D] bg-[#4A3B8D]/10'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={avatar}
                              alt={`Avatar ${index + 1}`}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                // Hide broken images
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Student Number */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Student Number
              </label>
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                placeholder="Enter student number"
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                placeholder="Enter first name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Last Name <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                placeholder="Enter last name (optional)"
              />
            </div>

            {/* Gender Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
              >
                <option value="">Select gender</option>
                <option value="Boy">Boy</option>
                <option value="Girl">Girl</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2 bg-[#D96B7B] text-white rounded-lg font-bold hover:brightness-95 transition disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

