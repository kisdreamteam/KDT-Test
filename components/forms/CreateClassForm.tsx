'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface CreateClassFormProps {
  onClose: () => void;
}

export default function CreateClassForm({ onClose }: CreateClassFormProps) {
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Creating class:', { className, grade });
    onClose();
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
      <form onSubmit={handleSubmit} className="space-y-4">
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
            <option value="GR1">GR1</option>
            <option value="GR2">GR2</option>
            <option value="GR3">GR3</option>
            <option value="GR4">GR4</option>
            <option value="GR5">GR5</option>
            <option value="GR6">GR6</option>
            <option value="GR7">GR7</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
