'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';
import ViewPopup from './ViewPopup';
import IconViewDots from '@/components/iconsCustom/iconViewDots';

interface BottomNavSeatingViewProps {
  currentClassName: string | null;
  sidebarOpen: boolean;
}

export default function BottomNavSeatingView({ 
  currentClassName, 
  sidebarOpen
}: BottomNavSeatingViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const leftPosition = useBottomNavPosition(sidebarOpen);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const [viewPopupPosition, setViewPopupPosition] = useState({ left: 0, bottom: 0 });
  const viewButtonRef = useRef<HTMLDivElement>(null);

  // Update view popup position when it opens
  useEffect(() => {
    if (isViewPopupOpen && viewButtonRef.current) {
      const rect = viewButtonRef.current.getBoundingClientRect();
      setViewPopupPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isViewPopupOpen]);

  // Close view popup when clicking outside
  useEffect(() => {
    if (!isViewPopupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (viewButtonRef.current && !viewButtonRef.current.contains(e.target as Node)) {
        setIsViewPopupOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isViewPopupOpen]);

  const handleEditSeatingChart = () => {
    // Get the current layout ID from localStorage
    // Extract classId from pathname (format: /dashboard/classes/[classId])
    const classDetailMatch = pathname?.match(/\/dashboard\/classes\/([^/]+)/);
    const classId = classDetailMatch ? classDetailMatch[1] : null;
    
    let layoutId: string | null = null;
    if (classId && typeof window !== 'undefined') {
      // Get from localStorage
      const storageKey = `seatingChart_selectedLayout_${classId}`;
      layoutId = localStorage.getItem(storageKey);
    }
    
    window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: true } }));
    // Update URL to include mode=edit parameter and layout ID if available
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', 'edit');
    if (layoutId) {
      params.set('layout', layoutId);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : `${pathname}?mode=edit`;
    router.push(newUrl);
  };

  return (
    <div 
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 transition-all duration-300 border-t border-[#4A3B8D] overflow-hidden"
      style={{ left: `${leftPosition}px`, right: '0.5rem' }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left side buttons */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 md:gap-8 lg:gap-15">
          {/* View Button - Always show */}
          {currentClassName && (
            <div className="relative flex-shrink-0" ref={viewButtonRef}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewPopupOpen(!isViewPopupOpen);
                }}
                className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2"
              >
                {/* 9 dots grid icon */}
                <IconViewDots />
                <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">View</h2>
              </div>
              <ViewPopup 
                isOpen={isViewPopupOpen} 
                position={viewPopupPosition} 
                onClose={() => setIsViewPopupOpen(false)} 
              />
            </div>
          )}

          {/* Edit Seating Chart Button */}
          <div 
            onClick={handleEditSeatingChart}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Edit/Pencil icon */}
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Seating Editor View</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

