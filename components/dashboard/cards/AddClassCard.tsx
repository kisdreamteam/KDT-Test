import IconPlus from '@/components/iconsCustom/iconPlus';

interface AddClassCardProps {
  onClick: () => void;
}

export default function AddClassCard({ onClick }: AddClassCardProps) {
  return (
    <div 
      className="bg-blue-100 font-spartan rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
      onClick={onClick}
    >
      <div className="text-center">
        {/* Add Icon */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <IconPlus className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Add Text */}
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
          Add New Class
        </h3>

        {/* Placeholder Student Count */}
        <p className="text-sm text-gray-600 text-center">
          Create another class
        </p>
      </div>
    </div>
  );
}

