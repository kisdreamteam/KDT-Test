'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import CreateClassForm from '../../components/forms/CreateClassForm';
import { createClient } from '@/lib/supabase/client';

interface Class {
  id: string;
  name: string;
  grade: string;
  school_year: string;
  teacher_id: string;
  is_archived: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setError('You must be logged in to view classes.');
        return;
      }

      // Fetch classes for the current teacher
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching classes:', error?.message || error);
        setError('Failed to load classes. Please try again.');
        return;
      }

      setClasses(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close with refresh
  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchClasses(); // Refresh classes after modal closes
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading classes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchClasses}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Regular Class Cards */}
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/dashboard/classes/${cls.id}`}
            className="block"
          >
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer relative group">
              {/* Settings Icon */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Class Icon */}
              <div className="text-center mb-4">
                <Image
                  src="/images/1Landing Page Image.png"
                  alt={`${cls.name} icon`}
                  width={80}
                  height={80}
                  className="mx-auto mb-2"
                />
              </div>

              {/* Class Name */}
              <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                {cls.name}
              </h3>

              {/* Grade and School Year */}
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600">{cls.grade}</p>
                <p className="text-xs text-gray-500">{cls.school_year}</p>
              </div>

              {/* Placeholder Student Count - TODO: Fetch actual student count */}
              <p className="text-sm text-gray-600 text-center">
                0 Students
              </p>
            </div>
          </Link>
        ))}

        {/* Add New Class Card */}
        <div 
          className="bg-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="text-center">
            {/* Add Icon */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">+</span>
              </div>
            </div>

            {/* Add Text */}
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
              Add New Class
            </h3>

            {/* Placeholder Student Count */}
            <p className="text-sm text-gray-600 text-center">
              Create your first class
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-600 mb-4">Create your first class to get started!</p>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <CreateClassForm onClose={handleModalClose} />
      </Modal>
    </div>
  );
}
