import { Student } from "@/lib/types";
import { normalizeAvatarPath } from "@/lib/iconUtils";
import IconSettingsWheel from "@/components/iconsCustom/iconSettingsWheel";
import BaseCard from "@/components/ui/BaseCard";

interface StudentCardProps {
  student: Student;
  openDropdownId: string | null;
  onToggleDropdown: (studentId: string, event: React.MouseEvent) => void;
  onEdit: (studentId: string) => void;
  onDelete: (studentId: string, studentName: string) => void;
  onClick: (student: Student) => void;
}

export default function StudentCard({
  student,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onDelete,
  onClick,
}: StudentCardProps) {
  return (
    <BaseCard
      data-student-card={student.id}
      className="z-[1] overflow-hidden hover:shadow-md hover:!bg-blue-100"
      variant="default"
      contentLayout="space-between"
      title={student.first_name}
      titleClassName="pointer-events-none text-gray-900"
      iconWrapperClassName="pointer-events-none"
      onClick={() => onClick(student)}
      topRightSlot={
        <div
          className="relative"
          data-dropdown-container
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={(e) => onToggleDropdown(student.id, e)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            data-dropdown-button
          >
            <IconSettingsWheel className="h-10 w-10" />
          </button>

          {openDropdownId === student.id && (
            <div className="absolute right-0 top-8 z-10 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(student.id);
                  }}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(student.id, `${student.first_name} ${student.last_name}`);
                  }}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                >
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
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
