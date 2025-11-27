import Image from 'next/image';
import { Student } from '@/lib/types';

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
    <div
      key={student.id}
      data-student-card={`${student.id}`}
      onClick={() => onClick(student)}
      className="bg-white font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-6 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col"
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Settings Icon with Dropdown */}
      <div 
        className="absolute top-4 right-4 z-10"
        data-dropdown-container
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="relative">
          <button
            onClick={(e) => onToggleDropdown(student.id, e)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            data-dropdown-button
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
          {openDropdownId === student.id && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(student.id);
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
                    onDelete(student.id, `${student.first_name} ${student.last_name}`);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Avatar */}
      <div className="flex justify-center mb-1 pointer-events-none flex-shrink-0">
        <Image
          src={student.avatar || "/images/students/avatars/student_avatar_1.png"}
          alt={`${student.first_name} ${student.last_name} avatar`}
          width={100}
          height={100}
          className="rounded-xl bg-[#FDF2F0]"
        />
      </div>

      {/* Student Name */}
      <div className="text-center mb-1 pointer-events-none flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">
          {student.first_name}
        </h3>
      </div>

      {/* Student Points */}
      <div className="text-center pointer-events-none mt-auto">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDF2F0] text-red-400 text-xl font-large font-bold">
          {student.points || 0}
        </div>
      </div>
    </div>
  );
}

