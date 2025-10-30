'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardProvider } from '@/context/DashboardContext';

interface TeacherProfile {
  id: string;
  title: string;
  name: string;
  email?: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  school_year: string;
  teacher_id: string;
  is_archived: boolean;
  created_at: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  useEffect(() => {
    fetchTeacherProfile();
    fetchClasses();

    // Listen for class updates from the main dashboard
    const handleClassUpdate = () => {
      console.log('Sidebar: Received class update event, refreshing classes...');
      fetchClasses();
    };

    window.addEventListener('classUpdated', handleClassUpdate);
    
    return () => {
      window.removeEventListener('classUpdated', handleClassUpdate);
    };
  }, []);

  const fetchTeacherProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      console.log('Fetching teacher profile for user:', user.id);

      // Fetch teacher profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, title, name')
        .eq('id', user.id)
        .single();

      console.log('Teacher profile data:', data);
      console.log('Teacher profile error:', error);

      if (error) {
        console.error('Error fetching teacher profile:', error?.message || error);
        return;
      }

      setTeacherProfile(data);
    } catch (err) {
      console.error('Unexpected error fetching teacher profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setIsLoadingClasses(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      console.log('Fetching classes for sidebar, user:', user.id);

      // Fetch classes for the current teacher
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      console.log('Sidebar classes data:', data);
      console.log('Sidebar classes error:', error);

      if (error) {
        console.error('Error fetching classes for sidebar:', error?.message || error);
        return;
      }

      setClasses(data || []);
    } catch (err) {
      console.error('Unexpected error fetching classes for sidebar:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  return (
    <div className="flex h-screen bg-pink-50">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r-2 border-purple-800 flex flex-col`}>
        <div className="p-4 flex flex-col h-full">
          {/* Character Illustration */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="text-center">
              <Image
                src="/images/shared/default-image.png"
                alt="User Avatar"
                width={200}
                height={200}
                className="mx-auto mb-2"
              />
              <div className="text-sm text-gray-600 font-bold text-center">Korean International School</div>
            </div>
          </div>

          {/* All Classes Section */}
          <Link href="/dashboard" className="block">
            <div className="bg-blue-900 text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
              <h2 className="text-center font-semibold">All Classes</h2>
            </div>
          </Link>

          {/* Classes List */}
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            {isLoadingClasses ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading classes...</span>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No classes yet</p>
              </div>
            ) : (
              classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/dashboard/classes/${cls.id}`}
                  className="block"
                >
                  <div className="flex items-center space-x-3 p-2 hover:bg-purple-300 rounded cursor-pointer transition-colors">
                    {/* Class Image - Same as class cards */}
                    <div className="w-8 h-8 flex-shrink-0">
                      <Image
                        src="/images/1Landing Page Image.png"
                        alt={`${cls.name} icon`}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 block truncate">
                        {cls.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {cls.grade}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* User Section */}
          <div className="mt-auto">
            <div className="bg-pink-400 text-white p-3 rounded-lg mb-2">
              <div className="text-center font-semibold">
                KI-EUN
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              21 teachers
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white h-30 py-4 flex items-center justify-between px-4">
          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 text-2xl hover:text-gray-800 w-8 flex justify-start"
          >
            ☰
          </button>

          {/* Main Title */}
          <h1 className="text-2xl font-bold text-gray-900 flex-1 text-center">
            {isLoadingProfile ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-2"></div>
                Loading...
              </div>
            ) : teacherProfile ? (
              `${teacherProfile.title} ${teacherProfile.name}'s Classes`
            ) : (
              "Classes"
            )}
          </h1>

          {/* KIS Points Logo */}
          <div className="flex items-center w-40 justify-end">
            <Image
              src="/images/shared/profile-avatar-dashboard.png"
              alt="KIS Points"
              width={160}
              height={80}
              className="object-contain"
            />
          </div>
        </div>

        {/* Main Content */}
        <DashboardProvider value={{ classes, isLoadingClasses, refreshClasses: fetchClasses }}>
          <div className="flex-1 bg-pink-50 p-6">
            {children}
          </div>
        </DashboardProvider>
      </div>
    </div>
  );
}
