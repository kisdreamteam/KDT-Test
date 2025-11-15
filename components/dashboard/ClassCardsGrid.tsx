import ClassCard from './ClassCard';
import AddClassCard from './AddClassCard';

interface Class {
  id: string;
  name: string;
  icon?: string;
}

interface ClassCardsGridProps {
  classes: Class[];
  studentCounts: Record<string, number>;
  openDropdownId: string | null;
  onToggleDropdown: (classId: string, event: React.MouseEvent) => void;
  onEdit: (classId: string) => void;
  onArchive: (classId: string, className: string) => void;
  onAddClass: () => void;
}

export default function ClassCardsGrid({
  classes,
  studentCounts,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onArchive,
  onAddClass,
}: ClassCardsGridProps) {
  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-5 py-5">
      {classes.map((cls) => (
        <ClassCard
          key={cls.id}
          classItem={cls}
          studentCount={studentCounts[cls.id] || 0}
          openDropdownId={openDropdownId}
          onToggleDropdown={onToggleDropdown}
          onEdit={onEdit}
          onArchive={onArchive}
        />
      ))}
      <AddClassCard onClick={onAddClass} />
    </div>
  );
}

