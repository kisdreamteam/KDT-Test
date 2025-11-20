import { Student } from '@/lib/types';
import StudentCard from './StudentCard';
import AddStudentCard from './AddStudentCard';

interface StudentCardsGridProps {
  students: Student[];
  openDropdownId: string | null;
  onToggleDropdown: (studentId: string, event: React.MouseEvent) => void;
  onEdit: (studentId: string) => void;
  onDelete: (studentId: string, studentName: string) => void;
  onStudentClick: (student: Student) => void;
  onAddStudent: () => void;
}

export default function StudentCardsGrid({
  students,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onDelete,
  onStudentClick,
  onAddStudent,
}: StudentCardsGridProps) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8 ">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          openDropdownId={openDropdownId}
          onToggleDropdown={onToggleDropdown}
          onEdit={onEdit}
          onDelete={onDelete}
          onClick={onStudentClick}
        />
      ))}
      <AddStudentCard onClick={onAddStudent} />
    </div>
  );
}

