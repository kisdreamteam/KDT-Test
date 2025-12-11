'use client';

import Image from 'next/image';
import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';

interface SeatingChart {
  id: string;
  name: string;
  class_id: string;
  created_at: string;
}

interface LeftNavSeatingChartViewProps {
  onAddLayout?: () => void;
  layouts?: SeatingChart[];
  selectedLayoutId?: string | null;
  onSelectLayout?: (layoutId: string) => void;
  onDeleteLayout?: (layoutId: string, layoutName: string, e: React.MouseEvent) => void;
  isLoadingLayouts?: boolean;
}

export default function LeftNavSeatingChartView({ 
  onAddLayout, 
  layouts = [], 
  selectedLayoutId, 
  onSelectLayout,
  onDeleteLayout,
  isLoadingLayouts = false
}: LeftNavSeatingChartViewProps) {
  const { unseatedStudents, setSelectedStudentForGroup } = useSeatingChart();

  const handleStudentClick = (student: Student) => {
    setSelectedStudentForGroup(student);
    // Dispatch event to indicate a student is ready to be added to a group
    window.dispatchEvent(new CustomEvent('studentSelectedForGroup', { 
      detail: { student } 
    }));
  };

  return (
    <div className="p-4 flex flex-col h-full max-h-screen overflow-y-auto">
      {/* Character Illustration */}
      <div className="bg-[#fcf1f0] rounded-4xl p-0 mb-4">
        <div className="text-center">
          <Image
            src="/images/shared/left-nav-seating-view.png"
            alt="User Avatar"
            width={250}
            height={250}
            className="mx-auto mb-2"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
      </div>

      {/* Add Layout Button */}
      {onAddLayout && (
        <button
          onClick={onAddLayout}
          className="w-full bg-red-400 text-white p-3 rounded-lg mb-4 hover:bg-red-500 transition-colors cursor-pointer"
        >
          <h2 className="text-center font-semibold">Add Layout</h2>
        </button>
      )}

      {/* Layouts List */}
      <div className="space-y-2 mb-6 max-h-90 overflow-y-auto">
        {isLoadingLayouts ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading layouts...</span>
          </div>
        ) : layouts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No layouts yet</p>
          </div>
        ) : (
          layouts.map((layout) => (
            <div
              key={layout.id}
              className="relative"
            >
              <button
                onClick={() => onSelectLayout?.(layout.id)}
                className={`w-full flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                  selectedLayoutId === layout.id
                    ? 'bg-purple-400 text-white hover:bg-purple-500'
                    : 'hover:bg-blue-200'
                }`}
              >
                <div className="flex-1 min-w-0 text-left">
                  <span className={`text-xl font-medium block truncate ${
                    selectedLayoutId === layout.id ? 'text-white' : 'text-gray-800'
                  }`}>
                    Layout: {layout.name}
                  </span>
                </div>
              </button>
              {/* Trash can icon */}
              {onDeleteLayout && (
                <button
                  onClick={(e) => onDeleteLayout(layout.id, layout.name, e)}
                  className="absolute top-2.5 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
                  title={`Delete ${layout.name}`}
                >
                  <svg
                    className="w-4 h-4"
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
                </button>
              )}
            </div>
          ))
        )}
      </div> 
    </div>
  );
}
