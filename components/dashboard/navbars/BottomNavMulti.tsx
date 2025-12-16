'use client';

import { useState, useEffect } from 'react';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';
import IconTimerClock from '@/components/iconsCustom/iconTimerClock';
import IconRandomArrows from '@/components/iconsCustom/iconRandomArrows';
import IconCheckCircle from '@/components/iconsCustom/iconCheckCircle';
import IconCircleX from '@/components/iconsCustom/iconCircleX';
import IconNoCircleX from '@/components/iconsCustom/iconNoCircleX';
import IconStarTrophy from '@/components/iconsCustom/iconStarTrophy';
import BotNavGrayButton from './botNavGrayButton';

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
          <BotNavGrayButton
            icon={<IconCheckCircle />}
            label="Select All"
            onClick={handleSelectAll}
          />

          {/* Select None Button */}
          <BotNavGrayButton
            icon={<IconCircleX className={`w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 ${selectedCount > 0 ? 'text-gray-400' : 'text-gray-300'}`} />}
            label="Select None"
            onClick={handleSelectNone}
            enabled={selectedCount > 0}
          />

          {/* Recently Select Button */}
          <BotNavGrayButton
            icon={<IconTimerClock className={`w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 ${hasRecentlySelected ? 'text-gray-400' : 'text-gray-300'}`} />}
            label="Recently Selected"
            onClick={handleRecentlySelect}
            enabled={hasRecentlySelected}
          />

          {/* Inverse Select Button */}
          <BotNavGrayButton
            icon={<IconRandomArrows className={`w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 ${selectedCount > 0 ? 'text-gray-400' : 'text-gray-300'}`} />}
            label="Inverse Select"
            onClick={handleInverseSelect}
            enabled={selectedCount > 0}
          />
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 lg:gap-15">
          {/* Cancel Button */}
          <div 
            onClick={handleCancel}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-[#dd7f81] rounded-xl text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* X icon */}
            <IconNoCircleX />
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Cancel</h2>
          </div>

          {/* Award Points Button */}
          <div 
            onClick={handleAwardPoints}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-[#4A3B8D] rounded-xl text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Star/Trophy icon */}
            <IconStarTrophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-white" />
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Award Points</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

