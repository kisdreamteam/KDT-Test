import ClassCardMulti from './ClassCardMulti';

interface Class {
  id: string;
  name: string;
  icon?: string;
}

interface ClassCardsGridMultiProps {
  classes: Class[];
  studentCounts: Record<string, number>;
  selectedClassIds: string[];
  onSelectClass: (classId: string) => void;
}

export default function ClassCardsGridMulti({
  classes,
  studentCounts,
  selectedClassIds,
  onSelectClass,
}: ClassCardsGridMultiProps) {
  return (
    <div 
      className="grid gap-6 bg-[#fcf1f0]"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
      }}
    >
      {classes.map((cls) => (
        <ClassCardMulti
          key={cls.id}
          classItem={cls}
          studentCount={studentCounts[cls.id] || 0}
          isSelected={selectedClassIds.includes(cls.id)}
          onSelect={onSelectClass}
        />
      ))}
    </div>
  );
}

