import ClassCard from '../../cards/ClassCard';
import AddClassCard from '../../cards/AddClassCard';

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
  archiveButtonText?: string;
  showAddCard?: boolean;
  onDelete?: (classId: string, className: string) => void;
  showDelete?: boolean;
}

export default function ClassCardsGrid({
  classes,
  studentCounts,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onArchive,
  onAddClass,
  archiveButtonText,
  showAddCard = true,
  onDelete,
  showDelete = false,
}: ClassCardsGridProps) {
  return (
    <div 
      className="grid gap-6"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
      }}
    >
      {classes.map((cls) => (
        <ClassCard
          key={cls.id}
          classItem={cls}
          studentCount={studentCounts[cls.id] || 0}
          openDropdownId={openDropdownId}
          onToggleDropdown={onToggleDropdown}
          onEdit={onEdit}
          onArchive={onArchive}
          archiveButtonText={archiveButtonText}
          onDelete={onDelete}
          showDelete={showDelete}
        />
      ))}
      {showAddCard && <AddClassCard onClick={onAddClass} />}
    </div>
  );
}

