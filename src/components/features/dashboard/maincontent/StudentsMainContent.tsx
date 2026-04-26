import type { Student } from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';
import type { PointLogRow } from '@/hooks/useClassPointLog';
import EmptyState from '@/components/ui/EmptyState';
import ClassPointLogSlidePanel from '@/components/ui/ClassPointLogSlidePanel';
import AppViewSeatingChart from '@/components/features/dashboard/AppViewSeatingChart';
import AppViewSeatingChartEditor from '@/components/features/dashboard/AppViewSeatingChartEditor';
import StudentCardsGrid from '@/components/features/dashboard/maincontent/viewStudentsGrid/StudentCardsGrid';

interface StudentsMainContentProps {
  classId: string;
  currentView: string;
  isSeatingEditMode: boolean;
  isEditModeFromURL: boolean;
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  sortedStudents: Student[];
  isMultiSelectMode: boolean;
  selectedStudentIds: string[];
  classIcon: string;
  totalClassPoints: number;
  openDropdownId: string | null;
  isPointLogOpen: boolean;
  isPointLogLoading: boolean;
  pointLogError: string | null;
  logTotalCount: number;
  pagedPointLogRows: PointLogRow[];
  safeLogPage: number;
  totalPages: number;
  rowsPerPage: number;
  toolbarTopPx: number;
  toolbarBottomPx: number;
  setLogPage: Dispatch<SetStateAction<number>>;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  onSelectStudent: (studentId: string) => void;
  onToggleDropdown: (studentId: string, event: React.MouseEvent) => void;
  onEditStudent: (studentId: string) => void;
  onDeleteStudent: (studentId: string, studentName: string) => void;
  onStudentClick: (student: Student) => void;
  onWholeClassClick: () => void;
  onAddStudent: () => void;
}

export default function StudentsMainContent({
  classId,
  currentView,
  isSeatingEditMode,
  isEditModeFromURL,
  students,
  setStudents,
  sortedStudents,
  isMultiSelectMode,
  selectedStudentIds,
  classIcon,
  totalClassPoints,
  openDropdownId,
  isPointLogOpen,
  isPointLogLoading,
  pointLogError,
  logTotalCount,
  pagedPointLogRows,
  safeLogPage,
  totalPages,
  rowsPerPage,
  toolbarTopPx,
  toolbarBottomPx,
  setLogPage,
  setRowsPerPage,
  onSelectStudent,
  onToggleDropdown,
  onEditStudent,
  onDeleteStudent,
  onStudentClick,
  onWholeClassClick,
  onAddStudent,
}: StudentsMainContentProps) {
  return (
    <div className={currentView === 'seating' ? 'h-full min-h-0 w-full' : ''}>
      <div
        className={
          currentView === 'grid'
            ? 'max-w-10xl mx-auto text-white-500 pr-[5.75rem] sm:pr-24'
            : 'h-full min-h-0 w-full text-white-500'
        }
      >
        {currentView === 'seating' ? (
          (isSeatingEditMode || isEditModeFromURL) ? (
            <AppViewSeatingChartEditor classId={classId} students={students} />
          ) : (
            <AppViewSeatingChart
              classId={classId}
              students={students}
              setStudents={setStudents}
              isMultiSelectMode={isMultiSelectMode}
              selectedStudentIds={selectedStudentIds}
              onSelectStudent={onSelectStudent}
            />
          )
        ) : (
          <>
            <ClassPointLogSlidePanel
              isOpen={isPointLogOpen}
              position="fixed"
              rightPx={72}
              topPx={toolbarTopPx}
              bottomPx={toolbarBottomPx}
              zIndex={35}
              logTotalCount={logTotalCount}
              pointLogError={pointLogError}
              isPointLogLoading={isPointLogLoading}
              pagedRows={pagedPointLogRows}
              safeLogPage={safeLogPage}
              totalPages={totalPages}
              rowsPerPage={rowsPerPage}
              setLogPage={setLogPage}
              setRowsPerPage={setRowsPerPage}
            />

            {students.length === 0 ? (
              <EmptyState
                title="No students yet"
                message="Students will appear here once they are added to this class."
                buttonText="Add Your First Student"
                onAddClick={onAddStudent}
              />
            ) : (
              <StudentCardsGrid
                sortedStudents={sortedStudents}
                isMultiSelectMode={isMultiSelectMode}
                selectedStudentIds={selectedStudentIds}
                classIcon={classIcon}
                totalClassPoints={totalClassPoints}
                openDropdownId={openDropdownId}
                onWholeClassClick={onWholeClassClick}
                onSelectStudent={onSelectStudent}
                onToggleDropdown={onToggleDropdown}
                onEditStudent={onEditStudent}
                onDeleteStudent={onDeleteStudent}
                onStudentClick={onStudentClick}
                onAddStudent={onAddStudent}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

