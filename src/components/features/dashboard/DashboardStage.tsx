'use client';

import { useCallback, useState } from 'react';
import TopNav from '@/components/features/navbars/TopNav';
import BottomNavStudents from '@/components/features/navbars/BottomNavStudents';
import BottomNavMulti from '@/components/features/navbars/BottomNavMulti';
import BottomNavSeatingEdit from '@/components/features/navbars/BottomNavSeatingEdit';
import Timer from '@/components/features/dashboard/tools/Timer';
import Random from '@/components/features/dashboard/tools/Random';
import CanvasToolbar from '@/components/ui/CanvasToolbar';
import { StageToolbarProvider, type StageToolbarConfig } from '@/components/features/dashboard/StageToolbarContext';

interface DashboardStageProps {
  children: React.ReactNode;
  isSeatingView: boolean;
  isEditMode: boolean;
  isLoadingProfile: boolean;
  currentClassName: string | null;
  teacherProfile: {
    title: string;
    name: string;
  } | null;
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
  const handleSetToolbarConfig = useCallback((config: StageToolbarConfig | null) => {
    setToolbarConfig(config);
  }, [isSeatingView]);
  const showTopNav = !isSeatingView;
  const stageContentPadding = isSeatingView ? '' : 'pl-2 pt-2';
  const showBottomNav = currentClassName && !isTimerOpen && !isRandomOpen;

  return (
    <div
      className={[
        'h-full w-full overflow-hidden grid',
        'grid-cols-[1fr_3.5rem]',
        'grid-rows-[7.5rem_1fr_5rem]',
        currentClassName ? 'bg-brand-purple' : 'bg-brand-cream',
      ].join(' ')}
    >
      {/* Top nav */}
      {showTopNav && (
        <div className="col-start-1 col-span-2 row-start-1 overflow-hidden">
          <TopNav
            isLoadingProfile={isLoadingProfile}
            currentClassName={currentClassName}
            teacherProfile={teacherProfile}
          />
        </div>
      )}

      {/* Main content cell */}
      <div
        className={[
          'col-start-1 h-full w-full overflow-hidden',
          isSeatingView ? 'row-start-1 row-span-2' : 'row-start-2',
          stageContentPadding,
        ].join(' ')}
      >
        <div className="h-full w-full overflow-hidden">
          <StageToolbarProvider value={{ setToolbar: handleSetToolbarConfig }}>
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
      </div>

      {/* Toolbar rail */}
      {toolbarConfig && (
        <div
          data-stage-toolbar-slot
          className={[
            'col-start-2 h-full overflow-hidden',
            isSeatingView ? 'row-start-1 row-span-2' : 'row-start-2',
          ].join(' ')}
        >
          <CanvasToolbar
            className={`h-full ${toolbarConfig.className ?? ''}`}
            topActions={toolbarConfig.topActions}
            bottomActions={toolbarConfig.bottomActions}
          />
        </div>
      )}

      {/* Bottom nav */}
      {showBottomNav && (
        <div className="col-start-1 col-span-2 row-start-3 overflow-visible relative z-20 w-full">
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
        </div>
      )}
    </div>
  );
}
