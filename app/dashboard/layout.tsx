'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardProvider } from '@/context/DashboardContext';
import { StudentSortProvider } from '@/context/StudentSortContext';
import { SeatingChartProvider } from '@/context/SeatingChartContext';
import LeftNav from '@/components/dashboard/navbars/LeftNav';
import LeftNavSeatingChart from '@/components/dashboard/navbars/LeftNavSeatingChart';
import TopNav from '@/components/dashboard/navbars/TopNav';
import BottomNavStudents from '@/components/dashboard/navbars/BottomNavStudents';
import BottomNavMulti from '@/components/dashboard/navbars/BottomNavMulti';
import BottomNavSeatingView from '@/components/dashboard/navbars/BottomNavSeatingView';
import BottomNavSeatingEdit from '@/components/dashboard/navbars/BottomNavSeatingEdit';
import MainContent from '@/components/dashboard/maincontent/MainContent';
import Timer from '@/components/dashboard/tools/Timer';
import Random from '@/components/dashboard/tools/Random';

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

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [currentClassName, setCurrentClassName] = useState<string | null>(null);
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Check if we're in seating chart edit mode
  const isEditMode = searchParams.get('mode') === 'edit';
  
  // Get current view mode from URL
  const currentView = (searchParams.get('view') || 'grid') as 'grid' | 'seating';
  const isSeatingView = currentView === 'seating';
  
  // Extract classId from pathname for seating chart sidebar
  const classDetailMatch = pathname?.match(/\/dashboard\/classes\/([^/]+)/);
  const classId = classDetailMatch ? classDetailMatch[1] : null;

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

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoadingClasses(true);
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      console.log('Fetching classes for sidebar, user:', user.id, 'viewMode:', viewMode);

      // Fetch classes for the current teacher based on viewMode
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .eq('is_archived', viewMode === 'archived')
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
  }, [viewMode]);

  const fetchTeacherCount = async () => {
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Teacher');
      
      if (error) {
        console.error('Error fetching teacher count:', error);
        return;
      }
      
      setTeacherCount(count || 0);
    } catch (err) {
      console.error('Unexpected error fetching teacher count:', err);
    }
  };

  const fetchClassName = useCallback(async (classId: string) => {
    try {
      console.log('Fetching class name for classId:', classId);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
      
      console.log('Class name data:', data);
      console.log('Class name error:', error);
      
      if (data) {
        console.log('Setting class name to:', data.name);
        setCurrentClassName(data.name);
      } else if (error) {
        console.error('Error fetching class name:', error);
        setCurrentClassName(null);
      }
    } catch (err) {
      console.error('Unexpected error fetching class name:', err);
      setCurrentClassName(null);
    }
  }, []);

  // Listen for multi-select state changes
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      setTimeout(() => {
        setIsMultiSelectMode(event.detail.isMultiSelect);
      }, 0);
    };

    window.addEventListener('multiSelectStateChanged', handleStateChange as EventListener);
    return () => {
      window.removeEventListener('multiSelectStateChanged', handleStateChange as EventListener);
    };
  }, []);

  useEffect(() => {
    fetchTeacherProfile();
    fetchClasses();
    fetchTeacherCount();

    // Listen for class updates from the main dashboard
    const handleClassUpdate = () => {
      console.log('Sidebar: Received class update event, refreshing classes...');
      fetchClasses();
    };

    window.addEventListener('classUpdated', handleClassUpdate);
    
    return () => {
      window.removeEventListener('classUpdated', handleClassUpdate);
    };
  }, [fetchClasses]);

  // Refetch classes when viewMode changes
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Detect route changes and update header
  useEffect(() => {
    console.log('Pathname changed to:', pathname);
    // Check if we're on a class detail page
    const classDetailMatch = pathname?.match(/\/dashboard\/classes\/([^/]+)/);
    
    console.log('Class detail match:', classDetailMatch);
    
    if (classDetailMatch) {
      const classId = classDetailMatch[1];
      console.log('Extracted classId:', classId);
      fetchClassName(classId);
    } else {
      // On main dashboard, clear class name
      console.log('On main dashboard, clearing class name');
      setCurrentClassName(null);
    }
  }, [pathname, fetchClassName]);

  return (
    // Outer Container of the left-nav and main content container
    <div className="flex flex-row h-screen bg-[#4A3B8D] pl-2 pb-0 pt-0">
      {/* Wrap everything in SeatingChartProvider so sidebar and editor can share state */}
      <SeatingChartProvider>
        {/* Left Sidebar */}
        <div className={`${sidebarOpen ? 'w-76' : 'w-0'} transition-all duration-300 overflow-hidden bg-white flex flex-col`} data-sidebar-container>
          {isEditMode && classId ? (
            <LeftNavSeatingChart classId={classId} />
          ) : (
            <LeftNav 
              classes={classes}
              isLoadingClasses={isLoadingClasses}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative pl-2 pr-2 pt-2">
            <StudentSortProvider>
              {/* Top Bar */}
              <TopNav
                isLoadingProfile={isLoadingProfile}
                currentClassName={currentClassName}
                teacherProfile={teacherProfile}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />

              {/* Main Content */}
              <DashboardProvider value={{ 
                classes, 
                isLoadingClasses, 
                teacherProfile, 
                isLoadingProfile,
                refreshClasses: fetchClasses,
                viewMode,
                setViewMode
              }}>
                {isTimerOpen ? (
                  <Timer onClose={() => setIsTimerOpen(false)} />
                ) : isRandomOpen ? (
                  <Random onClose={() => setIsRandomOpen(false)} />
                ) : (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto " style={currentClassName && !isTimerOpen && !isRandomOpen ? { maxHeight: 'calc(100% - 80px)' } : {}}>
                      <MainContent currentClassName={currentClassName}>
                        {children}
                      </MainContent>
                    </div>
                    {currentClassName && !isTimerOpen && !isRandomOpen && (
                      <div className="h-20 flex-shrink-0"></div>
                    )}
                  </div>
                )}
              </DashboardProvider>

              {/* Bottom Bar - Only visible when on a class page and not viewing timer/random */}
              {currentClassName && !isTimerOpen && !isRandomOpen && (
                <>
                  {isSeatingView && isEditMode ? (
                    <BottomNavSeatingEdit
                      currentClassName={currentClassName}
                      sidebarOpen={sidebarOpen}
                    />
                  ) : isSeatingView ? (
                    <BottomNavSeatingView
                      currentClassName={currentClassName}
                      sidebarOpen={sidebarOpen}
                    />
                  ) : isMultiSelectMode ? (
                    <BottomNavMulti
                      sidebarOpen={sidebarOpen}
                    />
                  ) : (
                    <BottomNavStudents
                      currentClassName={currentClassName}
                      sidebarOpen={sidebarOpen}
                      onTimerClick={() => setIsTimerOpen(true)}
                      onRandomClick={() => setIsRandomOpen(true)}
                    />
                  )}
                </>
              )}
          </StudentSortProvider>
        </div>
      </SeatingChartProvider>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#4A3B8D]"><div className="text-white">Loading...</div></div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
