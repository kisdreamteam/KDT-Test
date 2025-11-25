import { Student } from '@/lib/types';
import StudentCardMulti from './StudentCardMulti';

interface StudentCardsGridMultiProps {
  students: Student[];
  selectedStudentIds: string[];
  onSelectStudent: (studentId: string) => void;
}

export default function StudentCardsGridMulti({
  students,
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

