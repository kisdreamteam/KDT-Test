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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      console.log('Starting fetchClasses...');
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('User error:', userError);
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        setError('You must be logged in to view classes.');
        return;
      }

      console.log('Fetching classes for teacher_id:', user.id);

      // Fetch classes for the current teacher
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      console.log('Supabase query result - data:', data);
      console.log('Supabase query result - error:', error);

      if (error) {
        console.error('Error fetching classes:', error?.message || error);
        console.error('Error details:', error);
        setError('Failed to load classes. Please try again.');
        return;
      }

      console.log('Successfully fetched classes:', data);
      console.log('Number of classes:', data?.length || 0);
      setClasses(data || []);
      
      // Dispatch custom event to notify sidebar of class updates
      window.dispatchEvent(new CustomEvent('classUpdated'));
    } catch (err) {
      console.error('Unexpected error in fetchClasses:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack');
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close with refresh
  const handleModalClose = () => {
    console.log('Modal closing, refreshing classes...');
    setIsModalOpen(false);
    fetchClasses(); // Refresh classes after modal closes
  };

  // Test function to debug database access
  const testDatabaseAccess = async () => {
    try {
      const supabase = createClient();
      console.log('Testing direct database access...');
      
      // Test 1: Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Test - Current user:', user);
      
      if (user) {
        // Test 2: Try to fetch ALL classes (no filters)
        const { data: allClasses, error: allError } = await supabase
          .from('classes')
          .select('*');
        console.log('Test - All classes:', allClasses);
        console.log('Test - All classes error:', allError);
        
        // Test 3: Try to fetch classes for this user
        const { data: userClasses, error: userError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);
        console.log('Test - User classes:', userClasses);
        console.log('Test - User classes error:', userError);
      }
    } catch (err) {
      console.error('Test error:', err);
    }
  };

  // Handle dropdown toggle
  const toggleDropdown = (classId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === classId ? null : classId);
  };

  // Handle archive class
  const handleArchiveClass = async (classId: string, className: string) => {
    if (confirm(`Are you sure you want to archive this class?`)) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('classes')
          .update({ is_archived: true })
          .eq('id', classId);

        if (error) {
          console.error('Error archiving class:', error);
          alert('Failed to archive class. Please try again.');
          return;
        }

        console.log('Class archived successfully');
        setOpenDropdownId(null);
        fetchClasses(); // Refresh the list
      } catch (err) {
        console.error('Unexpected error archiving class:', err);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Handle edit class
  const handleEditClass = (classId: string) => {
    console.log('Edit class:', classId);
    setOpenDropdownId(null);
    // TODO: Implement edit functionality
    alert('Edit functionality will be implemented soon!');
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
      {classes.length === 0 ? (
        /* Empty State - Clean Dashboard */
        <div className="text-center py-16">
          {/* Empty State Icon */}
          <div className="text-gray-400 mb-8">
            <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Empty State Text */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to your dashboard!</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You haven-t created any classes yet. Create your first class to get started with managing your students.
          </p>
          
          {/* Prominent Add Class Button */}
          <div 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create Your First Class</span>
            </div>
          </div>
          
          {/* Debug Button - Remove this after debugging */}
          <div className="mt-4">
            <button 
              onClick={testDatabaseAccess}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Debug Database Access
            </button>
          </div>
        </div>
      ) : (
        /* Class Cards Grid - When classes exist */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Regular Class Cards */}
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/dashboard/classes/${cls.id}`}
              className="block"
            >
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer relative group">
                {/* Settings Icon with Dropdown */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => toggleDropdown(cls.id, e)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdownId === cls.id && (
                      <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditClass(cls.id);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleArchiveClass(cls.id, cls.name);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                            </svg>
                            Archive Class
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                Create another class
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <CreateClassForm onClose={handleModalClose} />
      </Modal>
    </div>
  );
}
