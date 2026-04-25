import { Student } from "@/lib/types";
import { normalizeAvatarPath } from "@/lib/iconUtils";
import BaseCard from "@/components/ui/BaseCard";

interface StudentCardMultiProps {
  student: Student;
  isSelected: boolean;
  onSelect: (studentId: string) => void;
}

export default function StudentCardMulti({
  student,
  isSelected,
  onSelect,
}: StudentCardMultiProps) {
  return (
    <BaseCard
      className={isSelected ? "overflow-hidden hover:shadow-md" : "overflow-hidden hover:shadow-md hover:!bg-blue-100"}
      variant="default"
      contentLayout="space-between"
      isSelected={isSelected}
      aria-pressed={isSelected}
      title={student.first_name}
      titleClassName="pointer-events-none text-gray-900"
      iconWrapperClassName="pointer-events-none"
      onClick={() => onSelect(student.id)}
      topRightSlot={
        isSelected
          ? undefined
          : (
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center pointer-events-none"
              title="Select"
              aria-hidden
            >
              <span
                className="inline-block h-5 w-5 rounded-full border-[3px] border-gray-400 bg-white shadow-sm ring-1 ring-gray-200/80"
              />
            </div>
            )
      }
      icon={
        <img
          src={normalizeAvatarPath(student.avatar)}
          alt={`${student.first_name} ${student.last_name} avatar`}
          width={100}
          height={100}
          className="rounded-xl bg-[#FDF2F0]"
          decoding="async"
        />
      }
    >
      <div className="pointer-events-none w-full text-center">
        <div className="inline-flex items-center rounded-full bg-[#FDF2F0] px-3 py-1 text-xl font-bold text-red-400">
          {student.points || 0}
        </div>
      </div>
    </BaseCard>
  );
}
