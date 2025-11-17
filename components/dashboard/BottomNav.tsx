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
      className="bg-white h-20 py-6 w-full flex items-center justify-left gap-10 pl-10 pt-10 bg-white h-15 py-6 transition-all duration-300">
        <div className="bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
          <h2 className="text-center font-semibold">Toolkit</h2>
        </div>
        <div className="bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
          <h2 className="text-center font-semibold">Random</h2>
        </div>
        <div 
          onClick={onTimerClick}
          className="bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer"
        >
          <h2 className="text-center font-semibold">Timer</h2>
        </div>
        <div className="bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
          <h2 className="text-center font-semibold">Multiple Select</h2>
        </div>
    </div>
  );
}
