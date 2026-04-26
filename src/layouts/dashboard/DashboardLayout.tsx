'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { DashboardProvider } from '@/context/DashboardContext';
import { StudentSortProvider } from '@/context/StudentSortContext';
import { SeatingChartProvider } from '@/context/SeatingChartContext';
import { SeatingLayoutNavProvider, SeatingLayoutNavData } from '@/context/SeatingLayoutNavContext';
import LeftNav from '@/components/features/navbars/LeftNav';
import LeftNavSeatingChartEdit from '@/components/features/navbars/LeftNavSeatingChartEdit';
import DashboardStage from '@/components/features/dashboard/DashboardStage';
import EditClassModal from '@/components/modals/EditClassModal';

interface TeacherProfile {
  id: string;
  title: string;
  name: string;
  role: string;
  preferred_view?: 'seating' | 'students' | null;
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
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [viewPreference, setViewPreference] = useState<'seating' | 'students'>('students');
  const [activeSeatingLayoutId, setActiveSeatingLayoutId] = useState<string | null>(null);
  const [seatingLayoutData, setSeatingLayoutData] = useState<SeatingLayoutNavData | null>(null);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Current class ID from URL (when on a class detail page)
  const currentClassId = pathname ? (pathname.match(/\/dashboard\/classes\/([^/]+)/)?.[1] ?? null) : null;
  
  // Check if we're in seating chart edit mode
  const isEditMode = searchParams?.get('mode') === 'edit';

  // Get current view mode from URL
  const currentView = (searchParams?.get('view') || 'grid') as 'grid' | 'seating';
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
        .select('id, title, name, role, preferred_view')
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
        const preferredView =
          data.preferred_view === 'seating' || data.preferred_view === 'students'
            ? data.preferred_view
            : 'students';
        setViewPreference(preferredView);
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

  const updateViewPreference = useCallback(
    async (newView: 'seating' | 'students') => {
      setViewPreference(newView);
      try {
        const supabase = createClient();
        const { data: authData, error: sessionError } = await supabase.auth.getSession();
        const userId = authData.session?.user?.id ?? teacherProfile?.id;
        if (sessionError || !userId) {
          if (sessionError) {
            console.error('Session error while updating preferred view:', sessionError);
          }
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .update({ preferred_view: newView })
          .eq('id', userId);
        if (error) {
          console.error('Error updating preferred view:', error);
        }
      } catch (err) {
        console.error('Unexpected error updating preferred view:', err);
      }
    },
    [teacherProfile?.id]
  );
  
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

  // If the URL has no explicit view, initialize it from persisted teacher preference.
  useEffect(() => {
    if (!pathname?.includes('/dashboard/classes/')) return;
    if (!searchParams) return;
    if (searchParams.has('view')) return;

    const params = new URLSearchParams(searchParams.toString());
    if (viewPreference === 'seating') {
      params.set('view', 'seating');
    } else {
      params.delete('view');
      params.delete('mode');
    }

    const base = pathname ?? '/';
    const newUrl = params.toString() ? `${base}?${params.toString()}` : base;
    router.replace(newUrl);
  }, [pathname, router, searchParams, viewPreference]);

  return (
    <DashboardProvider value={{ 
      classes: filteredClasses, 
      isLoadingClasses, 
      teacherProfile, 
      isLoadingProfile,
      refreshClasses: fetchClasses,
      viewMode,
      setViewMode,
      viewPreference,
      updateViewPreference,
      activeSeatingLayoutId,
      setActiveSeatingLayoutId,
    }}>
      <SeatingChartProvider>
        <StudentSortProvider>
          <SeatingLayoutNavProvider setSeatingLayoutData={setSeatingLayoutData}>
            {/* God Box (Left Nav, DashboardStage)*/}
            <div className="h-screen w-screen overflow-hidden flex flex-row bg-brand-purple">
              {/* God Box split: Left nav */}
              <div className="w-76 h-full pl-2 flex-shrink-0">
                <div className="h-full overflow-hidden bg-white">
                  {isSeatingView && isEditMode ? (
                    <LeftNavSeatingChartEdit />
                  ) : (
                    <LeftNav
                      classes={classes}
                      isLoadingClasses={isLoadingClasses}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      seatingLayoutData={isSeatingView && !isEditMode ? seatingLayoutData : null}
                    />
                  )}
                </div>
              </div>
              {/* God Box split: DashboardStage (top nav, main content, bottom nav) */}
              <div className="flex-1 h-full overflow-hidden pl-2 pr-2 pt-2">
                <DashboardStage
                  isSeatingView={isSeatingView}
                  isEditMode={isEditMode}
                  isLoadingProfile={isLoadingProfile}
                  currentClassName={currentClassName}
                  teacherProfile={teacherProfile}
                  isTimerOpen={isTimerOpen}
                  isRandomOpen={isRandomOpen}
                  onCloseTimer={() => setIsTimerOpen(false)}
                  onCloseRandom={() => setIsRandomOpen(false)}
                  isMultiSelectMode={isMultiSelectMode}
                  classId={currentClassId}
                  onEditClass={() => setIsEditClassModalOpen(true)}
                  onTimerClick={() => setIsTimerOpen(true)}
                  onRandomClick={() => setIsRandomOpen(true)}
                >
                  {children}
                </DashboardStage>
              </div>
            </div>
          </SeatingLayoutNavProvider>
        </StudentSortProvider>
      </SeatingChartProvider>

      {currentClassId && (
        <EditClassModal
          isOpen={isEditClassModalOpen}
          onClose={() => setIsEditClassModalOpen(false)}
          classId={currentClassId}
          onRefresh={fetchClasses}
        />
      )}
    </DashboardProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

function DashboardLayoutFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-brand-purple">
      <div className="text-white">Loading...</div>
    </div>
  );
}
