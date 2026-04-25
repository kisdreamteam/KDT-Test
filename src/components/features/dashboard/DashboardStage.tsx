'use client';

import TopNav from '@/components/features/navbars/top/TopNav';
import BottomNavStudents from '@/components/features/navbars/bottom/BottomNavStudents';
import BottomNavMulti from '@/components/features/navbars/bottom/BottomNavMulti';
import BottomNavSeatingEdit from '@/components/features/navbars/bottom/BottomNavSeatingEdit';
import Timer from '@/components/features/dashboard/tools/Timer';
import Random from '@/components/features/dashboard/tools/Random';

interface TeacherProfile {
  title: string;
  name: string;
}

interface DashboardStageProps {
  children: React.ReactNode;
  isSeatingView: boolean;
  isEditMode: boolean;
  isLoadingProfile: boolean;
  currentClassName: string | null;
  teacherProfile: TeacherProfile | null;
  onToggleSidebar: () => void;
  isTimerOpen: boolean;
  isRandomOpen: boolean;
  onCloseTimer: () => void;
  onCloseRandom: () => void;
  isMultiSelectMode: boolean;
  sidebarOpen: boolean;
  classId: string | null;
  onEditClass: () => void;
  onTimerClick: () => void;
  onRandomClick: () => void;
}

export default function DashboardStage({
  children,
  isSeatingView,
  isEditMode,
  isLoadingProfile,
  currentClassName,
  teacherProfile,
  onToggleSidebar,
  isTimerOpen,
  isRandomOpen,
  onCloseTimer,
  onCloseRandom,
  isMultiSelectMode,
  sidebarOpen,
  classId,
  onEditClass,
  onTimerClick,
  onRandomClick,
}: DashboardStageProps) {
  const showTopNav = !(isSeatingView && !isEditMode);
  const showBottomNav = currentClassName && !isTimerOpen && !isRandomOpen;

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden ${currentClassName ? 'bg-[#4A3B8D]' : 'bg-[#fcf1f0]'}`}>
      {/* Top nav */}
      {showTopNav && (
        <div className="h-30 flex-shrink-0 overflow-hidden">
          <TopNav
            isLoadingProfile={isLoadingProfile}
            currentClassName={currentClassName}
            teacherProfile={teacherProfile}
            onToggleSidebar={onToggleSidebar}
          />
        </div>
      )}

      {/* Main stage */}
      <div className="flex-1 min-h-0 overflow-hidden relative pl-2 pt-2 pr-2">
        {isTimerOpen ? (
          <Timer onClose={onCloseTimer} />
        ) : isRandomOpen ? (
          <Random onClose={onCloseRandom} />
        ) : (
          <div className="h-full w-full overflow-hidden">
            {children}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="h-20 flex-shrink-0 overflow-hidden">
        {showBottomNav && (
          <>
            {isSeatingView && isEditMode ? (
              <BottomNavSeatingEdit
                currentClassName={currentClassName}
                sidebarOpen={sidebarOpen}
                classId={classId}
                onEditClass={onEditClass}
              />
            ) : isMultiSelectMode ? (
              <BottomNavMulti sidebarOpen={sidebarOpen} />
            ) : (
              <BottomNavStudents
                currentClassName={currentClassName}
                sidebarOpen={sidebarOpen}
                onTimerClick={onTimerClick}
                onRandomClick={onRandomClick}
                sortingDisabled={isSeatingView}
                classId={classId}
                onEditClass={onEditClass}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
