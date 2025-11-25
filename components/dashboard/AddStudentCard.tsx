interface AddStudentCardProps {
  onClick: () => void;
}

export default function AddStudentCard({ onClick }: AddStudentCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-blue-300 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 shadow-md p-6 cursor-pointer transition-all duration-200 aspect-square flex flex-col relative overflow-hidden hover:shadow-lg"
    >
      <div className="flex flex-col items-center justify-center h-full text-center">
        {/* Add Icon */}
        <div className="mb-4 flex-shrink-0">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-2xl font-bold">+</span>
          </div>
        </div>

        {/* Add Text */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex-shrink-0">
          Add New Student
        </h3>

        {/* Placeholder Text */}
        <p className="text-sm text-gray-600">
          Add another student
        </p>
      </div>
    </div>
  );
}

