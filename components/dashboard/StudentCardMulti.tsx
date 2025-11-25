import Image from 'next/image';
import { Student } from '@/lib/types';

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
    <div 
      onClick={() => onSelect(student.id)}
      className={`rounded-3xl hover:rounded-3xl shadow-md p-6 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group aspect-square flex flex-col cursor-pointer ${
        isSelected
          ? 'bg-blue-300 hover:bg-blue-400'
          : 'bg-white hover:bg-blue-100'
      }`}
    >
      {/* Radio Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(student.id);
          }}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 shadow-md border-2 ${
            isSelected
              ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600'
              : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-gray-300'
          }`}
        >
          {isSelected ? (
            <svg
              className="w-7 h-7"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Student Avatar */}
      <div className="flex justify-center mb-4 pointer-events-none flex-shrink-0">
        <Image
          src={student.avatar || "/images/students/avatars/student_avatar_1.png"}
          alt={`${student.first_name} ${student.last_name} avatar`}
          width={80}
          height={80}
          className="rounded-xl bg-[#FDF2F0]"
        />
      </div>

      {/* Student Name */}
      <div className="text-center mb-3 pointer-events-none flex-shrink-0">
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

