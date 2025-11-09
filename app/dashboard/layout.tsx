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
  role: string;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  school_year: string;
  teacher_id: string;
  is_archived: boolean;
  created_at: string;
  icon?: string;
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
        .select('id, title, name, role')
        .eq('id', user.id)
        .single();

      console.log('Teacher profile data:', data);
      console.log('Teacher profile error:', error);

      if (error) {
        console.error('Error fetching teacher profile:', error?.message || error);
        return;
      }

      // Ensure role is set (provide default if missing)
      if (data) {
        setTeacherProfile({
          ...data,
          role: data.role || 'teacher'
        });
      }
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
    <div className="flex h-screen border-l-7 border-[#4A3B8D] bg-[#4A3B8D]">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-76' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-l-8 border-[#4A3B8D] flex flex-col`}>
        <div className="p-4 flex flex-col h-full">
          {/* Character Illustration */}
          <div className="bg-[#fcf1f0] rounded-4xl p-0 mb-4">
            <div className="text-center">
              <Image
                src="/images/shared/default-image.png"
                alt="User Avatar"
                width={250}
                height={250}
                className="mx-auto mb-2"
              />
              {/* <div className="text-sm text-gray-600 font-bold text-center">Korean International School</div> */}
            </div>
          </div>

          {/* All Classes Section */}
          <Link href="/dashboard" className="block">
            <div className="bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
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
                        src={cls.icon || "/images/1Landing Page Image.png"}
                        alt={`${cls.name} icon`}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xl font-medium text-gray-800 block truncate">
                        {cls.name}
                      </span>
                      {/* <span className="text-xs text-gray-500">
                        {cls.grade}
                      </span> */}
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
      <div className="flex-1 flex flex-col relative">
        {/* Top Bar */}
        <div className="bg-white h-30 py-6 flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-10 border-l-5 border-[#4A3B8D] border-t-15">
          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 text-2xl hover:text-gray-800 w-8 pt-12 flex justify-start"
          >
            ☰
          </button>

          {/* Main Title */}
          <h1 className="text-5xl font-bold text-gray-900 flex-1 text-left pl-10 pt-15 font-spartan">
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
        <DashboardProvider value={{ 
          classes, 
          isLoadingClasses, 
          teacherProfile, 
          isLoadingProfile,
          refreshClasses: fetchClasses
        }}>
          <div className="flex-1 bg-[#fcf1f0] p-6 border-r-10 border-b-5 border-l-5 border-[#4A3B8D] mt-[120px]"> 
            {children}
          </div>
        </DashboardProvider>
      </div>
    </div>
  );
}
