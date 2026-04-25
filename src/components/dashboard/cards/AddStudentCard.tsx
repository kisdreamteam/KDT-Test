import BaseCard from "@/components/ui/BaseCard";
import IconPlus from "@/components/iconsCustom/iconPlus";

interface AddStudentCardProps {
  onClick: () => void;
}

export default function AddStudentCard({ onClick }: AddStudentCardProps) {
  return (
    <BaseCard
      variant="action"
      title="Add New Student"
      subtitle="Add another student"
      onClick={onClick}
      className="border-2 border-dashed border-gray-300 hover:border-blue-400"
      icon={
        <div className="mb-1">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
            <IconPlus className="h-10 w-10 text-white" />
          </div>
        </div>
      }
    />
  );
}
