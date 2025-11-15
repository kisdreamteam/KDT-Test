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
}

export default function ClassCard({
  classItem,
  studentCount,
  openDropdownId,
  onToggleDropdown,
  onEdit,
  onArchive,
}: ClassCardProps) {
  return (
    <Link
      href={`/dashboard/classes/${classItem.id}`}
      className="block"
    >
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer relative group">
        {/* Settings Icon with Dropdown */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={(e) => onToggleDropdown(classItem.id, e)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-10 h-10"
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
              <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(classItem.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onArchive(classItem.id, classItem.name);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6m0 0l6-6m-6 6V3" />
                    </svg>
                    Archive Class
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Class Icon */}
        <div className="text-center mb-4">
          <Image
            src={classItem.icon || "/images/1Landing Page Image.png"}
            alt={`${classItem.name} icon`}
            width={80}
            height={80}
            className="mx-auto mb-2"
          />
        </div>

        {/* Class Name */}
        <h3 className="text-2xl font-semibold text-gray-800 text-center mb-2">
          {classItem.name}
        </h3>

        {/* Student Count */}
        <p className="text-xs text-gray-400 text-center font-bold">
          {studentCount !== undefined 
            ? `${studentCount} ${studentCount === 1 ? 'Student' : 'Students'}`
            : 'Loading...'
          }
        </p>
      </div>
    </Link>
  );
}

