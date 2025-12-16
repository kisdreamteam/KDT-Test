'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';
import ViewPopup from './ViewPopup';
import IconViewDots from '@/components/iconsCustom/iconViewDots';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import BotNavGrayButton from './botNavGrayButton';

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
              <BotNavGrayButton
                icon={<IconViewDots />}
                label="View"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewPopupOpen(!isViewPopupOpen);
                }}
                stopPropagation={true}
              />
              <ViewPopup 
                isOpen={isViewPopupOpen} 
                position={viewPopupPosition} 
                onClose={() => setIsViewPopupOpen(false)} 
              />
            </div>
          )}

          {/* Edit Seating Chart Button */}
          <BotNavGrayButton
            icon={<IconEditPencil />}
            label="Seating Editor View"
            onClick={handleEditSeatingChart}
          />
        </div>
      </div>
    </div>
  );
}

