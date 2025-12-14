import { Student } from '@/lib/types';
import StudentCardMulti from '../../cards/StudentCardMulti';
import WholeClassCard from '../../cards/WholeClassCard';

interface StudentCardsGridMultiProps {
  students: Student[];
  selectedStudentIds: string[];
  onSelectStudent: (studentId: string) => void;
  classIcon: string;
  totalClassPoints: number;
  onWholeClassClick: () => void;
}

export default function StudentCardsGridMulti({
  students,
  selectedStudentIds,
  onSelectStudent,
  classIcon,
  totalClassPoints,
  onWholeClassClick,
}: StudentCardsGridMultiProps) {
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
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
        }}
      >
        {/* Whole Class Card - Always First (for smoother transition from single view) */}
        <WholeClassCard 
          classIcon={classIcon}
          totalPoints={totalClassPoints}
          onClick={onWholeClassClick}
        />
        
        {/* Student Cards */}
        {students.map((student) => (
          <StudentCardMulti
            key={student.id}
            student={student}
            isSelected={selectedStudentIds.includes(student.id)}
            onSelect={onSelectStudent}
          />
        ))}
      </div>
    </div>
  );
}

