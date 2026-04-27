import type { Student } from '@/lib/types';
import CardsGrid from '@/components/ui/CardsGrid';
import ScaledGridFrame from '@/components/ui/ScaledGridFrame';
import WholeClassCard from '@/components/features/dashboard/cards/WholeClassCard';
import StudentCard from '@/components/features/dashboard/cards/StudentCard';
import StudentCardMulti from '@/components/features/dashboard/cards/StudentCardMulti';
import AddStudentCard from '@/components/features/dashboard/cards/AddStudentCard';

interface StudentCardsGridProps {
  sortedStudents: Student[];
  isMultiSelectMode: boolean;
  selectedStudentIds: string[];
  classIcon: string | null;
  totalClassPoints: number;
  openDropdownId: string | null;
  onWholeClassClick: () => void;
  onSelectStudent: (studentId: string) => void;
  onToggleDropdown: (studentId: string, event: React.MouseEvent) => void;
  onEditStudent: (studentId: string) => void;
  onDeleteStudent: (studentId: string, studentName: string) => void;
  onStudentClick: (student: Student) => void;
  onAddStudent: () => void;
}

export default function StudentCardsGrid({
  sortedStudents,
  isMultiSelectMode,
  selectedStudentIds,
  classIcon,
  totalClassPoints,
  openDropdownId,
  onWholeClassClick,
  onSelectStudent,
  onToggleDropdown,
  onEditStudent,
  onDeleteStudent,
  onStudentClick,
  onAddStudent,
}: StudentCardsGridProps) {
  return (
    <ScaledGridFrame remeasureKey={`${sortedStudents.length}-${isMultiSelectMode ? 1 : 0}`}>
      <CardsGrid>
        <WholeClassCard
          classIcon={classIcon}
          totalPoints={totalClassPoints}
          onClick={onWholeClassClick}
        />
        {sortedStudents.map((student) =>
          isMultiSelectMode ? (
            <StudentCardMulti
              key={student.id}
              student={student}
              isSelected={selectedStudentIds.includes(student.id)}
              onSelect={onSelectStudent}
            />
          ) : (
            <StudentCard
              key={student.id}
              student={student}
              openDropdownId={openDropdownId}
              onToggleDropdown={onToggleDropdown}
              onEdit={onEditStudent}
              onDelete={onDeleteStudent}
              onClick={onStudentClick}
            />
          )
        )}
        {!isMultiSelectMode && <AddStudentCard onClick={onAddStudent} />}
      </CardsGrid>
    </ScaledGridFrame>
  );
}

