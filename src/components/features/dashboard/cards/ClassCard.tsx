import Link from "next/link";
import { normalizeClassIconPath } from "@/lib/iconUtils";
import IconSettingsWheel from "@/components/iconsCustom/iconSettingsWheel";
import BaseCard from "@/components/ui/BaseCard";
import { useDashboard } from "@/context/DashboardContext";

interface Class {
  id: string;
  name: string;
  icon?: string;
  is_owner?: boolean;
}

interface ClassCardProps {
  classItem: Class;
  studentCount: number;
  openDropdownId: string | null;
  onToggleDropdown: (classId: string, event: React.MouseEvent) => void;
  onEdit: (classId: string) => void;
  onArchive: (classId: string, className: string) => void;
  archiveButtonText?: string;
  onDelete?: (classId: string, className: string) => void;
  showDelete?: boolean;
}

export default function ClassCard({
  classItem,
  studentCount,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onArchive,
  archiveButtonText = "Archive Class",
  onDelete,
  showDelete = false,
}: ClassCardProps) {
  const isOwner = classItem.is_owner !== false;
  const { viewPreference } = useDashboard();
  const classHref =
    viewPreference === "seating"
      ? `/dashboard/classes/${classItem.id}?view=seating`
      : `/dashboard/classes/${classItem.id}`;
  return (
    <Link href={classHref} className="block aspect-square w-full min-h-0">
      <BaseCard
        className="!aspect-auto h-full min-h-0 hover:shadow-md hover:!bg-blue-100"
        variant="default"
        title={
          <h3
            className="w-full overflow-hidden break-words text-center font-semibold text-gray-800"
            style={{
              fontSize: `clamp(0.75rem, ${Math.max(0.75, Math.min(1.5, 1.5 - (classItem.name.length - 8) * 0.04))}rem, 1.5rem)`,
              lineHeight: "1.2",
            }}
          >
            {classItem.name}
          </h3>
        }
        subtitle={
          studentCount !== undefined
            ? `${studentCount} ${studentCount === 1 ? "Student" : "Students"}`
            : "Loading..."
        }
        subtitleClassName="!text-xs !text-gray-400 !mb-0 !font-bold"
        topRightSlot={
          <div className="relative z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleDropdown(classItem.id, e);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 ${
                openDropdownId === classItem.id ? "bg-gray-100 text-gray-700" : ""
              }`}
            >
              <IconSettingsWheel className="h-5 w-5" />
            </button>

            {openDropdownId === classItem.id && (
              <div className="absolute right-0 top-12 z-50 w-56 transform rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-200 ease-out">
                <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-gray-200 bg-white" />
                <div className="py-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(classItem.id);
                    }}
                    className="group flex w-full items-center px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <svg
                      className="mr-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Edit Class</span>
                  </button>
                  {isOwner && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onArchive(classItem.id, classItem.name);
                        }}
                        className="group flex w-full items-center px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <svg
                          className="mr-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {archiveButtonText === "Unarchive Class" ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 8l6 6m0 0l6-6m-6 6V3"
                            />
                          )}
                        </svg>
                        <span>{archiveButtonText}</span>
                      </button>
                    </>
                  )}
                  {isOwner && showDelete && onDelete && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDelete(classItem.id, classItem.name);
                        }}
                        className="group flex w-full items-center px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-700"
                      >
                        <svg
                          className="mr-3 h-5 w-5 text-red-400 transition-colors group-hover:text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>Delete Class</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        }
        titleClassName="!mb-2 flex-1 min-h-0 flex items-center justify-center px-2"
        iconWrapperClassName="!mb-2 flex-shrink-0"
        icon={
          <img
            src={normalizeClassIconPath(classItem.icon)}
            alt={`${classItem.name} icon`}
            width={80}
            height={80}
            className="mb-0 mx-auto"
            decoding="async"
          />
        }
      >
        {!isOwner && (
          <p className="!mt-1 text-center text-[11px] font-semibold text-blue-600">Shared with you</p>
        )}
      </BaseCard>
    </Link>
  );
}
