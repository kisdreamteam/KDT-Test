'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { StudentSortProvider } from '@/context/StudentSortContext';
import { SeatingChartProvider } from '@/context/SeatingChartContext';
import { SeatingLayoutNavProvider, SeatingLayoutNavData } from '@/context/SeatingLayoutNavContext';
import LeftNav from '@/components/features/navbars/LeftNav';
import LeftNavSeatingChartEdit from '@/components/features/navbars/LeftNavSeatingChartEdit';
import DashboardStage from '@/components/features/dashboard/DashboardStage';
import EditClassModal from '@/components/modals/EditClassModal';

function DashboardLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    classes,
    currentClass,
    isLoadingClasses,
    teacherProfile,
    isLoadingProfile,
    refreshClasses,
    viewMode,
    setViewMode,
    viewPreference,
  } = useDashboard();
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [seatingLayoutData, setSeatingLayoutData] = useState<SeatingLayoutNavData | null>(null);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewPreferenceRef = useRef<'seating' | 'students'>(viewPreference);

  const currentClassId = pathname ? (pathname.match(/\/dashboard\/classes\/([^/]+)/)?.[1] ?? null) : null;
  const isEditMode = searchParams?.get('mode') === 'edit';
  const currentView = (searchParams?.get('view') || 'grid') as 'grid' | 'seating';
  const isSeatingView = currentView === 'seating';

  useEffect(() => {
    viewPreferenceRef.current = viewPreference;
  }, [viewPreference]);

  const currentClassName = currentClass?.name ?? null;
  const isClassRoute = !!currentClassId;
  const isClassesRootView = !isClassRoute;
  const topNavClassTitle = isClassRoute ? (currentClassName ?? 'Loading...') : currentClassName;

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
    const handleClassUpdate = () => {
      void refreshClasses();
    };
    window.addEventListener('classUpdated', handleClassUpdate);
    return () => window.removeEventListener('classUpdated', handleClassUpdate);
  }, [refreshClasses]);

  // Fallback only on mount/path change: if class route URL has no explicit view, seed it from persisted preference.
  useEffect(() => {
    const inClassRoute = !!pathname?.includes('/dashboard/classes/');
    const params = new URLSearchParams(window.location.search);
    const hasView = params.has('view');
    if (!inClassRoute) return;
    if (hasView) return;

    if (viewPreferenceRef.current === 'seating') {
      params.set('view', 'seating');
    } else {
      params.delete('view');
      params.delete('mode');
    }

    const base = pathname ?? '/';
    const currentSearch = window.location.search;
    const currentUrl = currentSearch ? `${base}${currentSearch}` : base;
    const newUrl = params.toString() ? `${base}?${params.toString()}` : base;
    if (newUrl === currentUrl) {
      return;
    }
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  return (
    <SeatingChartProvider>
      <StudentSortProvider>
        <SeatingLayoutNavProvider setSeatingLayoutData={setSeatingLayoutData}>
          <div className="h-screen w-screen overflow-hidden flex flex-row bg-brand-purple" >
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
            <div className="flex-1 h-full overflow-hidden pl-2 pr-2 pt-2">
              <DashboardStage
                isSeatingView={isSeatingView}
                showCanvasToolbar={!isClassesRootView}
                isEditMode={isEditMode}
                isLoadingProfile={isLoadingProfile}
                currentClassName={topNavClassTitle}
                teacherProfile={teacherProfile}
                suppressTeacherFallback={isClassRoute}
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
      {currentClassId && (
        <EditClassModal
          isOpen={isEditClassModalOpen}
          onClose={() => setIsEditClassModalOpen(false)}
          classId={currentClassId}
          onRefresh={refreshClasses}
        />
      )}
    </SeatingChartProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLayoutFallback />}>
      <DashboardProvider>
        <DashboardLayoutShell>{children}</DashboardLayoutShell>
      </DashboardProvider>
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
