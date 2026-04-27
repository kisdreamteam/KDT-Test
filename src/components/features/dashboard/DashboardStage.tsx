'use client';

import { useCallback } from 'react';
import IconAddPlus from '@/components/iconsCustom/iconAddPlus';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import IconPresentationBoard from '@/components/iconsCustom/iconPresentationBoard';
import IconDocumentClock from '@/components/iconsCustom/iconDocumentClock';
import TopNav from '@/components/features/navbars/TopNav';
import BottomNavStudents from '@/components/features/navbars/BottomNavStudents';
import BottomNavMulti from '@/components/features/navbars/BottomNavMulti';
import BottomNavSeatingEdit from '@/components/features/navbars/BottomNavSeatingEdit';
import Timer from '@/components/features/dashboard/tools/Timer';
import Random from '@/components/features/dashboard/tools/Random';
import CanvasToolbar from '@/components/ui/CanvasToolbar';
import { StageToolbarProvider } from '@/components/features/dashboard/StageToolbarContext';

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
  const noopSetToolbar = useCallback(() => {}, []);
  const showTopNav = !isSeatingView;
  const stageContentPadding = isSeatingView ? '' : 'pl-2 pt-2';
  const showBottomNav = currentClassName && !isTimerOpen && !isRandomOpen;
  const toolbarConfig = isSeatingView
    ? {
        className: 'z-10',
        topActions: isEditMode
          ? [
              {
                id: 'close-editor',
                title: 'Close editor',
                onClick: () => window.dispatchEvent(new CustomEvent('stageToolbarCloseEditor')),
                icon: (
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ),
              },
            ]
          : [
              {
                id: 'add',
                title: 'Create new layout',
                onClick: () => window.dispatchEvent(new CustomEvent('stageToolbarCreateLayout')),
                icon: <IconAddPlus className="w-6 h-6 text-black" />,
              },
              {
                id: 'edit',
                title: 'Seating Editor View',
                onClick: () => window.dispatchEvent(new CustomEvent('stageToolbarOpenSeatingEditor')),
                icon: <IconEditPencil className="w-6 h-6 text-black" strokeWidth={2} />,
              },
            ],
        bottomActions: isEditMode
          ? []
          : [
              {
                id: 'teacher-view',
                title: "Teacher's view",
                onClick: () => window.dispatchEvent(new CustomEvent('stageToolbarToggleTeacherView')),
                icon: <IconPresentationBoard className="w-6 h-6 text-black" strokeWidth={2} />,
              },
              {
                id: 'point-log',
                title: 'Toggle point log',
                onClick: () => window.dispatchEvent(new CustomEvent('stageToolbarTogglePointLog')),
                icon: <IconDocumentClock className="w-6 h-6 text-black" strokeWidth={2} />,
              },
            ],
      }
    : {
        className: '!bg-white',
        topActions: [
          {
            id: 'add',
            title: 'Create layout (seating view only)',
            disabled: true,
            icon: <IconAddPlus className="w-6 h-6 text-gray-500" />,
          },
          {
            id: 'edit',
            title: 'Seating Editor (seating view only)',
            disabled: true,
            icon: <IconEditPencil className="w-6 h-6 text-gray-500" strokeWidth={2} />,
          },
        ],
        bottomActions: [
          {
            id: 'teacher-view',
            title: "Teacher's view (seating view only)",
            disabled: true,
            icon: <IconPresentationBoard className="w-6 h-6 text-gray-500" strokeWidth={2} />,
          },
          {
            id: 'point-log',
            title: 'Toggle point log',
            onClick: () => window.dispatchEvent(new CustomEvent('stageToolbarTogglePointLog')),
            icon: <IconDocumentClock className="w-6 h-6 text-black" strokeWidth={2} />,
          },
        ],
      };

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
          <StageToolbarProvider value={{ setToolbar: noopSetToolbar }}>
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
