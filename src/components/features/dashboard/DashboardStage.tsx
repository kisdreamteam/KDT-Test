'use client';

import { useState } from 'react';
import TopNav from '@/components/features/navbars/top/TopNav';
import BottomNavStudents from '@/components/features/navbars/bottom/BottomNavStudents';
import BottomNavMulti from '@/components/features/navbars/bottom/BottomNavMulti';
import BottomNavSeatingEdit from '@/components/features/navbars/bottom/BottomNavSeatingEdit';
import Timer from '@/components/features/dashboard/tools/Timer';
import Random from '@/components/features/dashboard/tools/Random';
import CanvasToolbar from '@/components/ui/CanvasToolbar';
import { StageToolbarProvider, type StageToolbarConfig } from '@/components/features/dashboard/StageToolbarContext';

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
  isTimerOpen: boolean;
  isRandomOpen: boolean;
  onCloseTimer: () => void;
  onCloseRandom: () => void;
  isMultiSelectMode: boolean;
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
  isTimerOpen,
  isRandomOpen,
  onCloseTimer,
  onCloseRandom,
  isMultiSelectMode,
  classId,
  onEditClass,
  onTimerClick,
  onRandomClick,
}: DashboardStageProps) {
  const [toolbarConfig, setToolbarConfig] = useState<StageToolbarConfig | null>(null);
  const showTopNav = !(isSeatingView && !isEditMode);
  const showBottomNav = currentClassName && !isTimerOpen && !isRandomOpen;

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden ${currentClassName ? 'bg-brand-purple' : 'bg-brand-cream'}`}>
      {/* Top nav */}
      {showTopNav && (
        <div className="h-30 flex-shrink-0 overflow-hidden w-full">
          <TopNav
            isLoadingProfile={isLoadingProfile}
            currentClassName={currentClassName}
            teacherProfile={teacherProfile}
          />
        </div>
      )}

      {/* Main stage: stage-left (content) + stage-right (toolbar rail) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-row relative pl-2 pt-2 pr-2">
        <div className="flex-1 min-w-0 h-full overflow-y-auto">
          <StageToolbarProvider value={{ setToolbar: setToolbarConfig }}>
            {isTimerOpen ? (
              <Timer onClose={onCloseTimer} />
            ) : isRandomOpen ? (
              <Random onClose={onCloseRandom} />
            ) : (
              <div className="h-full w-full overflow-hidden">
                {children}
              </div>
            )}
          </StageToolbarProvider>
        </div>

        <div
          data-stage-toolbar-slot
          className={`w-14 h-full flex-shrink-0 ${isSeatingView ? '-ml-2 z-10' : ''}`}
        >
          {toolbarConfig && (
            <CanvasToolbar
              className={`h-full ${toolbarConfig.className ?? ''}`}
              topActions={toolbarConfig.topActions}
              bottomActions={toolbarConfig.bottomActions}
            />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="h-20 flex-shrink-0 overflow-visible relative z-20 w-full">
        {showBottomNav && (
          <>
            {isSeatingView && isEditMode ? (
              <BottomNavSeatingEdit
                currentClassName={currentClassName}
                classId={classId}
                onEditClass={onEditClass}
              />
            ) : isMultiSelectMode ? (
              <BottomNavMulti />
            ) : (
              <BottomNavStudents
                currentClassName={currentClassName}
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
