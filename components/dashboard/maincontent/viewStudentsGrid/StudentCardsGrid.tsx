import { Student } from '@/lib/types';
import StudentCard from '../../cards/StudentCard';
import AddStudentCard from '../../cards/AddStudentCard';
import WholeClassCard from '../../cards/WholeClassCard';
import { useLayoutEffect, useRef, useState } from 'react';

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
  const SCALE = 0.67;
  const scaledContainerRef = useRef<HTMLDivElement | null>(null);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const updateScaledHeight = () => {
      if (!scaledContainerRef.current) return;
      const unscaledHeight = scaledContainerRef.current.offsetHeight;
      setScaledHeight(unscaledHeight * SCALE);
    };

    updateScaledHeight();
    window.addEventListener('resize', updateScaledHeight);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScaledHeight)
        : null;
    if (observer && scaledContainerRef.current) {
      observer.observe(scaledContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScaledHeight);
      observer?.disconnect();
    };
  }, [students.length]);

  return (
    <div
      style={{
        height: scaledHeight ? `${scaledHeight}px` : undefined,
      }}
    >
      <div
        ref={scaledContainerRef}
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          width: `${100 / SCALE}%`, // Compensate for scaling: preserve visual width
        }}
      >
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
    </div>
  );
}

