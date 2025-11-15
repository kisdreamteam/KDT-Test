interface AddStudentCardProps {
  onClick: () => void;
}

export default function AddStudentCard({ onClick }: AddStudentCardProps) {
  return (
    <div 
      className="bg-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
      onClick={onClick}
    >
      <div className="text-center">
        {/* Add Icon */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-2xl font-bold">+</span>
          </div>
        </div>

        {/* Add Text */}
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
          Add New Student
        </h3>

        {/* Placeholder Text */}
        <p className="text-sm text-gray-600 text-center">
          Add another student
        </p>
      </div>
    </div>
  );
}

