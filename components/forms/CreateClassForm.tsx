'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface CreateClassFormProps {
  onClose: () => void;
}

export default function CreateClassForm({ onClose }: CreateClassFormProps) {
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Initialize Supabase client
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current User:', user); // Debug log for user object
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        console.error('User error details:', userError?.message || userError);
        alert('You must be logged in to create a class.');
        return;
      }

      // Call the database function to create a new class
      const { error } = await supabase.rpc('create_new_class', {
        class_name: className,
        class_grade: grade,
        class_school_year: "2025-2026"
      });

      if (error) {
        console.error('Supabase RPC error:', error?.message || error);
        console.error('Error code:', error?.code);
        console.error('Error hint:', error?.hint);
        alert('Failed to create class. Please try again.');
        return;
      }

      console.log('Class created successfully using RPC function');
      
      // Close modal - the parent component will handle refreshing the data
      onClose();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create new class</h2>
        
        {/* Icon/Image placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Image
              src="/images/shared/default-image.png"
              alt="Class icon"
              width={40}
              height={40}
              className="w-10 h-10"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleCreateClass} className="space-y-4">
        {/* School field (read-only) */}
        <div>
          <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
            School
          </label>
          <input
            type="text"
            id="school"
            value="Korean International School"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Class name field */}
        <div>
          <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-2">
            Class name
          </label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter class name"
            required
          />
        </div>

        {/* Grade dropdown */}
        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
            Grade
          </label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select a grade</option>
            <option value="Grade1">Grade1</option>
            <option value="Grade2">Grade2</option>
            <option value="Grade3">Grade3</option>
            <option value="Grade4">Grade4</option>
            <option value="Grade5">Grade5</option>
            <option value="Grade6">Grade6</option>
            <option value="Grade7">Grade7</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
