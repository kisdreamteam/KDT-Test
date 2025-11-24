import { Student } from '@/lib/types';
import StudentCardMulti from './StudentCardMulti';
import WholeClassCard from './WholeClassCard';

interface StudentCardsGridMultiProps {
  students: Student[];
  classIcon: string;
  totalClassPoints: number;
  onWholeClassClick: () => void;
  selectedStudentIds: string[];
  onSelectStudent: (studentId: string) => void;
}

export default function StudentCardsGridMulti({
  students,
  classIcon,
  totalClassPoints,
  onWholeClassClick,
  selectedStudentIds,
  onSelectStudent,
}: StudentCardsGridMultiProps) {
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
  );
}

