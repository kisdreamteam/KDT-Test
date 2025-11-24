import Image from 'next/image';

interface Class {
  id: string;
  name: string;
  icon?: string;
}

interface ClassCardMultiProps {
  classItem: Class;
  studentCount: number;
  isSelected: boolean;
  onSelect: (classId: string) => void;
}

export default function ClassCardMulti({
  classItem,
  studentCount,
  isSelected,
  onSelect,
}: ClassCardMultiProps) {
  return (
    <div 
      onClick={() => onSelect(classItem.id)}
      className={`rounded-lg shadow-md p-6 hover:shadow-xl hover:rounded-3xl transition-shadow relative group h-full flex flex-col aspect-square cursor-pointer ${
        isSelected
          ? 'bg-blue-300 hover:bg-blue-400'
          : 'bg-white hover:bg-blue-100'
      }`}
    >
      {/* Radio Button */}
      <div className="absolute top-0 right-0">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(classItem.id);
          }}
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-200 shadow-md border-2 ${
            isSelected
              ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600'
              : 'bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600 border-gray-300'
          }`}
        >
          {isSelected ? (
            <svg
              className="w-8 h-8"
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
              className="w-7 h-7"
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
  );
}

