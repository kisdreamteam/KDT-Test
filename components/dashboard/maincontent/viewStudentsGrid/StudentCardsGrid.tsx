import { Student } from '@/lib/types';
import StudentCard from '../../cards/StudentCard';
import AddStudentCard from '../../cards/AddStudentCard';
import WholeClassCard from '../../cards/WholeClassCard';

interface StudentCardsGridProps {
  students: Student[];
  classIcon: string;
  totalClassPoints: number;
  onWholeClassClick: () => void;
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
  onWholeClassClick,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onDelete,
  onStudentClick,
  onAddStudent,
}: StudentCardsGridProps) {
  return (
    <div 
      style={{
        transform: 'scale(0.67)',
        transformOrigin: 'top left',
        width: '149.25%', // Compensate for 0.67 scale: 100% / 0.67
        marginBottom: 'calc(2rem * 0.67)' // Scale the margin-bottom proportionally
      }}
    >
      <div 
        // smaller contained with only the cards (contained in a bigger container)
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
        }}
      >
        {/* Whole Class Card - Always First */}
        <WholeClassCard 
          classIcon={classIcon}
          totalPoints={totalClassPoints}
          onClick={onWholeClassClick}
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
    </div>
  );
}

