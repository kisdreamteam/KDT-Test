'use client';

import Image from 'next/image';

interface TeacherProfile {
  title: string;
  name: string;
}

interface BottomNavProps {
  isLoadingProfile: boolean;
  currentClassName: string | null;
  teacherProfile: TeacherProfile | null;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onTimerClick: () => void;
}

export default function BottomNav({ 
  isLoadingProfile, 
  currentClassName, 
  teacherProfile, 
  onToggleSidebar,
  sidebarOpen,
  onTimerClick
}: BottomNavProps) {
  // Calculate left margin based on sidebar state
  // w-76 = 19rem = 304px, plus pl-2 padding (0.5rem = 8px) on outer container
  // Total: 304px + 8px = 312px when sidebar is open
  const leftMargin = sidebarOpen ? '312px' : '8px';
  
  return (
    // Bottom Nav Container - Fixed at bottom
    <div 
      className="bg-white h-20 py-6 w-full flex items-center justify-center gap-15 pl-10 pt-10 bg-white h-15 py-6 transition-all duration-300">
        {/* Toolkit Button */}
        <div className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
          {/* 9 dots grid icon */}
          <svg 
            className="w-5 h-5 text-gray-400" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <rect x="3" y="3" width="5" height="5" rx="1" />
            <rect x="9.5" y="3" width="5" height="5" rx="1" />
            <rect x="16" y="3" width="5" height="5" rx="1" />
            <rect x="3" y="9.5" width="5" height="5" rx="1" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
            <rect x="16" y="9.5" width="5" height="5" rx="1" />
            <rect x="3" y="16" width="5" height="5" rx="1" />
            <rect x="9.5" y="16" width="5" height="5" rx="1" />
            <rect x="16" y="16" width="5" height="5" rx="1" />
          </svg>
          <h2 className="font-semibold text-gray-400">Toolkit</h2>
        </div>

        {/* Random Button */}
        <div className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
          {/* Shuffle icon */}
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
            />
          </svg>
          <h2 className="font-semibold text-gray-400">Random</h2>
        </div>

        {/* Timer Button */}
        <div 
          onClick={onTimerClick}
          className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg 
            className="w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <h2 className="font-semibold text-gray-400">Timer</h2>
        </div>

        {/* Multiple Select Button */}
        <div className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
          {/* Checkbox with checkmark icon */}
          <svg 
            className="w-5 h-5 text-gray-400" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="font-semibold text-gray-400">Multiple Select</h2>
        </div>

    </div>
  );
}
