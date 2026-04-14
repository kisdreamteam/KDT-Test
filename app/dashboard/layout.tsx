'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardProvider } from '@/context/DashboardContext';
import { StudentSortProvider } from '@/context/StudentSortContext';
import { SeatingChartProvider } from '@/context/SeatingChartContext';
import { SeatingLayoutNavProvider, SeatingLayoutNavData } from '@/context/SeatingLayoutNavContext';
import LeftNav from '@/components/dashboard/navbars/LeftNav';
import TopNav from '@/components/dashboard/navbars/TopNav';
import BottomNavStudents from '@/components/dashboard/navbars/BottomNavStudents';
import BottomNavMulti from '@/components/dashboard/navbars/BottomNavMulti';
import BottomNavSeatingEdit from '@/components/dashboard/navbars/BottomNavSeatingEdit';
import MainContent from '@/components/dashboard/maincontent/MainContent';
import Timer from '@/components/dashboard/tools/Timer';
import Random from '@/components/dashboard/tools/Random';
import EditClassModal from '@/components/modals/EditClassModal';

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
  is_owner?: boolean;
}

/** PostgREST / Postgres when RPC `list_accessible_classes` is not deployed yet */
function isMissingListAccessibleClassesRpc(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    msg.includes('could not find the function') ||
    msg.includes('schema cache')
  );
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
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [seatingLayoutData, setSeatingLayoutData] = useState<SeatingLayoutNavData | null>(null);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Current class ID from URL (when on a class detail page)
  const currentClassId = pathname ? (pathname.match(/\/dashboard\/classes\/([^/]+)/)?.[1] ?? null) : null;
  
  // Check if we're in seating chart edit mode
  const isEditMode = searchParams.get('mode') === 'edit';
  
  // Get current view mode from URL
  const currentView = (searchParams.get('view') || 'grid') as 'grid' | 'seating';
  const isSeatingView = currentView === 'seating';

  const fetchTeacherProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const supabase = createClient();
      // Use getSession() to avoid "Refresh Token Not Found" when no session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;

      if (sessionError || !user) {
        if (sessionError) console.error('Session error:', sessionError);
        router.replace('/login');
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
      // Use getSession() to avoid "Refresh Token Not Found" when no session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;

      if (sessionError || !user) {
        if (sessionError) console.error('Session error:', sessionError);
        router.replace('/login');
        return;
      }

      console.log('Fetching classes for sidebar, user:', user.id, 'viewMode:', viewMode);

      // Fetch classes accessible to current user (owner or collaborator)
      const { data, error } = await supabase.rpc('list_accessible_classes');

      console.log('Sidebar classes data:', data);
      console.log('Sidebar classes error:', error);

      let rows: Class[] = [];

      if (error) {
        // Any RPC failure: always try owner direct query (fixes early-return when error shape did not match "missing function")
        const { data: ownerRows, error: ownerError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id)
          .order('is_archived', { ascending: true })
          .order('created_at', { ascending: false });

        if (ownerError) {
          console.error('Error fetching classes (owner fallback):', ownerError?.message || ownerError);
          return;
        }

        rows = (ownerRows || []).map((r) => ({ ...r, is_owner: true }));
      } else {
        rows = (data || []) as Class[];
      }

      const sorted = [...rows].sort((a, b) => {
        if (a.is_archived !== b.is_archived) {
          return a.is_archived ? 1 : -1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setClasses(sorted);
    } catch (err) {
      console.error('Unexpected error fetching classes for sidebar:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [router]);
  
  // Filter classes for main content based on viewMode
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => 
      viewMode === 'archived' ? cls.is_archived : !cls.is_archived
    );
  }, [classes, viewMode]);
  const currentClassName = useMemo(
    () => classes.find((c) => c.id === currentClassId)?.name || null,
    [classes, currentClassId]
  );

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

  return (
    // Outer Container of the left-nav and main content container
    <div className="flex flex-row h-screen bg-[#4A3B8D] pl-2 pb-0 pt-0">
      {/* Wrap everything in SeatingChartProvider so sidebar and editor can share state */}
      <SeatingChartProvider>
        <SeatingLayoutNavProvider setSeatingLayoutData={setSeatingLayoutData}>
        {/* Left Sidebar - Always show LeftNav with classes; when in seating view (not edit), include layout list */}
        <div className={`${sidebarOpen ? 'w-76' : 'w-0'} transition-all duration-300 overflow-hidden bg-white flex flex-col`} data-sidebar-container>
          <LeftNav 
            classes={classes}
            isLoadingClasses={isLoadingClasses}
            viewMode={viewMode}
            setViewMode={setViewMode}
            seatingLayoutData={isSeatingView && !isEditMode ? seatingLayoutData : null}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative pl-2 pr-2 pt-2">
            <StudentSortProvider>
              {/* Top Bar - hidden in seating chart view so canvas matches editor size */}
              {!(isSeatingView && !isEditMode) && (
                <TopNav
                  isLoadingProfile={isLoadingProfile}
                  currentClassName={currentClassName}
                  teacherProfile={teacherProfile}
                  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
              )}

              {/* Main Content */}
              <DashboardProvider value={{ 
                classes: filteredClasses, 
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
                    <div
                      className="flex-1 overflow-y-auto "
                      data-dashboard-scroll-container
                      style={currentClassName && !isTimerOpen && !isRandomOpen ? { maxHeight: 'calc(100% - 80px)' } : {}}
                    >
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
                      classId={currentClassId}
                      onEditClass={() => setIsEditClassModalOpen(true)}
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
                      sortingDisabled={isSeatingView}
                      classId={currentClassId}
                      onEditClass={() => setIsEditClassModalOpen(true)}
                    />
                  )}
                </>
              )}
          </StudentSortProvider>
        </div>
        </SeatingLayoutNavProvider>
      </SeatingChartProvider>

      {/* Edit Class Modal (opened from bottom nav settings) */}
      {currentClassId && (
        <EditClassModal
          isOpen={isEditClassModalOpen}
          onClose={() => setIsEditClassModalOpen(false)}
          classId={currentClassId}
          onRefresh={fetchClasses}
        />
      )}
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
