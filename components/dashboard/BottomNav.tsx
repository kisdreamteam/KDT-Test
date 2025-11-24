'use client';

import { useState, useEffect } from 'react';
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
  onRandomClick: () => void;
}

export default function BottomNav({ 
  isLoadingProfile, 
  currentClassName, 
  teacherProfile, 
  onToggleSidebar,
  sidebarOpen,
  onTimerClick,
  onRandomClick
}: BottomNavProps) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Listen for multi-select state changes from components
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      setIsMultiSelectMode(event.detail.isMultiSelect);
    };

    window.addEventListener('multiSelectStateChanged', handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('multiSelectStateChanged', handleStateChange as EventListener);
    };
  }, []);

  // Calculate left position based on sidebar state
  // w-76 = 19rem = 304px (sidebar width)
  // Outer container has pl-2 (8px), main content has pl-2 pr-2 (8px each side)
  // When sidebar open: left = 8px (outer) + 304px (sidebar) + 8px (main content left) = 320px
  // When sidebar closed: left = 8px (outer) + 8px (main content left) = 16px
  // Right padding: 8px (main content right) + 8px (outer) = 16px
  const leftPosition = sidebarOpen ? '320px' : '16px';

  const handleSelectAll = () => {
    window.dispatchEvent(new CustomEvent('selectAll'));
  };

  const handleSelectNone = () => {
    window.dispatchEvent(new CustomEvent('selectNone'));
  };

  const handleCancel = () => {
    window.dispatchEvent(new CustomEvent('toggleMultiSelect'));
  };

  const handleAwardPoints = () => {
    // Placeholder - no function yet
    console.log('Award points clicked');
  };
  
  return (
    // Bottom Nav Container - Fixed at bottom
    <div 
      className="fixed bottom-0 bg-white h-20 py-6 flex items-center justify-between gap-15 pl-10 pr-10 pt-10 z-50 transition-all duration-300 border-t border-[#4A3B8D]"
      style={{ left: leftPosition, right: '8px' }}>
      {!isMultiSelectMode ? (
        // Normal mode buttons
        <>
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
          <div 
            onClick={onRandomClick}
            className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
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
          <div 
            onClick={() => {
              // Dispatch custom event to toggle multi-select mode
              window.dispatchEvent(new CustomEvent('toggleMultiSelect'));
            }}
            className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
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
        </>
      ) : (
        // Multi-select mode buttons
        <>
          <div className="flex items-center gap-15">
            {/* Select All Button */}
            <div 
              onClick={handleSelectAll}
              className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {/* Check all icon */}
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h2 className="font-semibold text-gray-400">Select All</h2>
            </div>

            {/* Select None Button */}
            <div 
              onClick={handleSelectNone}
              className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {/* Uncheck all icon */}
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h2 className="font-semibold text-gray-400">Select None</h2>
            </div>

            {/* Recently Select Button */}
            <div 
              className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {/* Clock/History icon */}
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
              <h2 className="font-semibold text-gray-400">Recently Select</h2>
            </div>

            {/* Inverse Select Button */}
            <div 
              className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {/* Swap/Inverse icon */}
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
              <h2 className="font-semibold text-gray-400">Inverse Select</h2>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-15">
            {/* Cancel Button */}
            <div 
              onClick={handleCancel}
              className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {/* X icon */}
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
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
              <h2 className="font-semibold text-gray-400">Cancel</h2>
            </div>

            {/* Award Points Button */}
            <div 
              onClick={handleAwardPoints}
              className="w-[200px] bg-white text-white p-3 mb-4 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {/* Star/Trophy icon */}
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
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                />
              </svg>
              <h2 className="font-semibold text-gray-400">Award Points</h2>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
