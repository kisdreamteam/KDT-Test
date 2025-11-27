import Image from 'next/image';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  icon?: string;
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
  archiveButtonText = 'Archive Class',
  onDelete,
  showDelete = false,
}: ClassCardProps) {
  return (
    <Link
      href={`/dashboard/classes/${classItem.id}`}
      className="block aspect-square"
    >
      <div className="bg-white rounded-lg font-spartan shadow-md py-6 hover:shadow-xl hover:rounded-3xl hover:bg-blue-100 transition-shadow cursor-pointer relative group h-full flex flex-col">
        {/* Settings Icon with Dropdown */}
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <button
              onClick={(e) => onToggleDropdown(classItem.id, e)}
              className={`w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 ${
                openDropdownId === classItem.id ? 'text-gray-700 bg-gray-100' : ''
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {openDropdownId === classItem.id && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                {/* Arrow pointer */}
                <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                
                <div className="py-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(classItem.id);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors duration-150 group"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Class</span>
                  </button>
                  <div className="my-1 border-t border-gray-100"></div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onArchive(classItem.id, classItem.name);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center transition-colors duration-150 group"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {archiveButtonText === 'Unarchive Class' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                      )}
                    </svg>
                    <span>{archiveButtonText}</span>
                  </button>
                  {showDelete && onDelete && (
                    <>
                      <div className="my-1 border-t border-gray-100"></div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDelete(classItem.id, classItem.name);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors duration-150 group"
                      >
                        <svg className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete Class</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Class Icon - Fixed */}
        <div className="text-center mb-4 flex-shrink-0">
          <Image
            src={classItem.icon || "/images/1Landing Page Image.png"}
            alt={`${classItem.name} icon`}
            width={80}
            height={80}
            className="mx-auto mb-2"
          />
        </div>

        {/* Class Name - Flexible with dynamic font sizing */}
        <div className="flex-1 flex items-center justify-center min-h-0 mb-2 px-2">
          <h3 
            className="font-semibold text-gray-800 text-center break-words overflow-hidden w-full"
            style={{
              fontSize: `clamp(0.75rem, ${Math.max(0.75, Math.min(1.5, 1.5 - (classItem.name.length - 8) * 0.04))}rem, 1.5rem)`,
              lineHeight: '1.2'
            }}
          >
            {classItem.name}
          </h3>
        </div>

        {/* Student Count - Fixed */}
        <p className="text-xs text-gray-400 text-center font-bold flex-shrink-0">
          {studentCount !== undefined 
            ? `${studentCount} ${studentCount === 1 ? 'Student' : 'Students'}`
            : 'Loading...'
          }
        </p>
      </div>
    </Link>
  );
}

