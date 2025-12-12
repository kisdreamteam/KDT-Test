'use client';

import { useState, useEffect } from 'react';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';

interface BottomNavMultiProps {
  sidebarOpen: boolean;
}

export default function BottomNavMulti({ sidebarOpen }: BottomNavMultiProps) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [hasRecentlySelected, setHasRecentlySelected] = useState(false);
  const leftPosition = useBottomNavPosition(sidebarOpen);

  // Check for recently selected data in localStorage
  const checkRecentlySelected = () => {
    const lastSelectedClasses = localStorage.getItem('lastSelectedClasses');
    const lastSelectedStudents = localStorage.getItem('lastSelectedStudents');
    const hasData = !!(lastSelectedClasses || lastSelectedStudents);
    setHasRecentlySelected(hasData);
  };

  // Listen for selection count changes
  useEffect(() => {
    const handleSelectionCountChange = (event: CustomEvent) => {
      setTimeout(() => {
        setSelectedCount(event.detail.count || 0);
      }, 0);
    };

    const handleStorageChange = () => {
      checkRecentlySelected();
    };

    checkRecentlySelected();

    window.addEventListener('selectionCountChanged', handleSelectionCountChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('recentlySelectedCleared', handleStorageChange);
    window.addEventListener('recentlySelectedUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('selectionCountChanged', handleSelectionCountChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('recentlySelectedCleared', handleStorageChange);
      window.removeEventListener('recentlySelectedUpdated', handleStorageChange);
    };
  }, []);

  const handleSelectAll = () => {
    window.dispatchEvent(new CustomEvent('selectAll'));
  };

  const handleSelectNone = () => {
    if (selectedCount > 0) {
      window.dispatchEvent(new CustomEvent('selectNone'));
    }
  };

  const handleCancel = () => {
    window.dispatchEvent(new CustomEvent('toggleMultiSelect'));
  };

  const handleAwardPoints = () => {
    window.dispatchEvent(new CustomEvent('awardPoints'));
  };

  const handleRecentlySelect = () => {
    if (hasRecentlySelected) {
      window.dispatchEvent(new CustomEvent('recentlySelect'));
    }
  };

  const handleInverseSelect = () => {
    if (selectedCount > 0) {
      window.dispatchEvent(new CustomEvent('inverseSelect'));
    }
  };

  return (
    <div 
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 border-t border-[#4A3B8D] overflow-hidden"
      style={{ left: `${leftPosition}px`, right: '0.5rem' }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left side buttons */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 md:gap-8 lg:gap-15">
          {/* Select All Button */}
          <div 
            onClick={handleSelectAll}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Check all icon */}
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-gray-400" 
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
            <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Select All</h2>
          </div>

          {/* Select None Button */}
          <div 
            onClick={handleSelectNone}
            className={`w-16 sm:w-24 md:w-32 lg:w-[200px] p-1 sm:p-2 md:p-2.5 lg:p-3 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 ${
              selectedCount > 0
                ? 'bg-white text-white hover:bg-pink-50 hover:shadow-sm cursor-pointer'
                : 'bg-gray-100 cursor-not-allowed opacity-50'
            }`}
          >
            {/* Uncheck all icon */}
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 ${selectedCount > 0 ? 'text-gray-400' : 'text-gray-300'}`}
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
            <h2 className={`font-semibold text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline ${selectedCount > 0 ? 'text-gray-400' : 'text-gray-300'}`}>Select None</h2>
          </div>

          {/* Recently Select Button */}
          <div 
            onClick={handleRecentlySelect}
            className={`w-16 sm:w-24 md:w-32 lg:w-[200px] p-1 sm:p-2 md:p-2.5 lg:p-3 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 ${
              hasRecentlySelected
                ? 'bg-white text-white hover:bg-pink-50 hover:shadow-sm cursor-pointer'
                : 'bg-gray-100 cursor-not-allowed opacity-50'
            }`}
          >
            {/* Clock/History icon */}
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 ${hasRecentlySelected ? 'text-gray-400' : 'text-gray-300'}`}
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
            <h2 className={`font-semibold text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline ${hasRecentlySelected ? 'text-gray-400' : 'text-gray-300'}`}>Recently Select</h2>
          </div>

          {/* Inverse Select Button */}
          <div 
            onClick={handleInverseSelect}
            className={`w-16 sm:w-24 md:w-32 lg:w-[200px] p-1 sm:p-2 md:p-2.5 lg:p-3 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 ${
              selectedCount > 0
                ? 'bg-white text-white hover:bg-pink-50 hover:shadow-sm cursor-pointer'
                : 'bg-gray-100 cursor-not-allowed opacity-50'
            }`}
          >
            {/* Swap/Inverse icon */}
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 ${selectedCount > 0 ? 'text-gray-400' : 'text-gray-300'}`}
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
            <h2 className={`font-semibold text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline ${selectedCount > 0 ? 'text-gray-400' : 'text-gray-300'}`}>Inverse Select</h2>
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 lg:gap-15">
          {/* Cancel Button */}
          <div 
            onClick={handleCancel}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-[#dd7f81] rounded-xl text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* X icon */}
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-white" 
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
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Cancel</h2>
          </div>

          {/* Award Points Button */}
          <div 
            onClick={handleAwardPoints}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-[#4A3B8D] rounded-xl text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Star/Trophy icon */}
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-white" 
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
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Award Points</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

