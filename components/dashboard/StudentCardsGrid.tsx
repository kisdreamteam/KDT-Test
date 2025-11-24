import { Student } from '@/lib/types';
import StudentCard from './StudentCard';
import AddStudentCard from './AddStudentCard';
import WholeClassCard from './WholeClassCard';

interface StudentCardsGridProps {
  students: Student[];
  classIcon: string;
  totalClassPoints: number;
  openDropdownId: string | null;
  onToggleDropdown: (studentId: string, event: React.MouseEvent) => void;
  onEdit: (studentId: string) => void;
  onDelete: (studentId: string, studentName: string) => void;
  onStudentClick: (student: Student) => void;
  onAddStudent: () => void;
}

export default function StudentCardsGrid({
  students,
  classIcon,
  totalClassPoints,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onDelete,
  onStudentClick,
  onAddStudent,
}: StudentCardsGridProps) {
  return (
    <div 
      className="grid gap-6 mb-8"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
      }}
    >
      {/* Whole Class Card - Always First */}
      <WholeClassCard 
        classIcon={classIcon}
        totalPoints={totalClassPoints}
      />
      
      {/* Student Cards */}
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

