'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStudentSort } from '@/context/StudentSortContext';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';
import ViewPopup from './ViewPopup';
import IconViewDots from '@/components/iconsCustom/iconViewDots';
import IconRandomArrows from '@/components/iconsCustom/iconRandomArrows';
import IconTimerClock from '@/components/iconsCustom/iconTimerClock';
import IconSortingArrows from '@/components/iconsCustom/iconSortingArrows';
import IconCheckBox from '@/components/iconsCustom/iconCheckBox';
import IconSettingsWheel from '@/components/iconsCustom/iconSettingsWheel';
import BotNavGrayButton from './botNavGrayButton';

interface BottomNavStudentsProps {
  currentClassName: string | null;
  sidebarOpen: boolean;
  onTimerClick: () => void;
  onRandomClick: () => void;
  /** When true (e.g. seating chart view), Sorting button is shown but disabled */
  sortingDisabled?: boolean;
  /** Current class ID (when on a class page) for opening Edit Class modal */
  classId?: string | null;
  /** Called when user chooses Edit Class from settings menu */
  onEditClass?: () => void;
}

export default function BottomNavStudents({ 
  currentClassName, 
  sidebarOpen,
  onTimerClick,
  onRandomClick,
  sortingDisabled = false,
  classId = null,
  onEditClass,
}: BottomNavStudentsProps) {
  const { sortBy, setSortBy } = useStudentSort();
  const router = useRouter();
  const leftPosition = useBottomNavPosition(sidebarOpen);
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);
  const sortButtonRef = useRef<HTMLDivElement>(null);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLDivElement>(null);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const viewButtonRef = useRef<HTMLDivElement>(null);

  // Close any open popup when clicking outside its trigger container.
  useEffect(() => {
    if (!isSortPopupOpen && !isSettingsPopupOpen && !isViewPopupOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (isSortPopupOpen && sortButtonRef.current && !sortButtonRef.current.contains(target)) {
        setIsSortPopupOpen(false);
      }
      if (isSettingsPopupOpen && settingsButtonRef.current && !settingsButtonRef.current.contains(target)) {
        setIsSettingsPopupOpen(false);
      }
      if (isViewPopupOpen && viewButtonRef.current && !viewButtonRef.current.contains(target)) {
        setIsViewPopupOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isSortPopupOpen, isSettingsPopupOpen, isViewPopupOpen]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Failed to log out. Please try again.');
        return;
      }
      router.push('/login');
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div 
      data-bottom-nav
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 border-t border-[#4A3B8D] overflow-visible"
      style={{ left: `${leftPosition}px`, right: '0.5rem' }}
    >
      {/* View Button - Only show when on a class page */}
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
            onClose={() => setIsViewPopupOpen(false)} 
          />
        </div>
      )}

      {/* Random Button */}
      <BotNavGrayButton
        icon={<IconRandomArrows />}
        label="Random"
        onClick={onRandomClick}
      />

      {/* Timer Button */}
      <BotNavGrayButton
        icon={<IconTimerClock />}
        label="Timer"
        onClick={onTimerClick}
      />

      {/* Sorting Button - Only show when on a class page; disabled in seating view */}
      {currentClassName && (
        <div className="relative flex-shrink-0" ref={sortButtonRef}>
          <BotNavGrayButton
            icon={<IconSortingArrows />}
            label="Sorting"
            onClick={(e) => {
              e.stopPropagation();
              if (!sortingDisabled) setIsSortPopupOpen(!isSortPopupOpen);
            }}
            stopPropagation={true}
            enabled={!sortingDisabled}
          />
          {/* Sort Popup */}
          {isSortPopupOpen && (
            <div 
              className="absolute bottom-full left-0 mb-2 bg-blue-100 rounded-lg shadow-lg border-4 border-[#4A3B8D] py-2 z-[100] min-w-[200px]"
            >
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                Sort by:
              </div>
              <button
                onClick={() => {
                  setSortBy('number');
                  setIsSortPopupOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  sortBy === 'number' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700'
                }`}
              >
                Student Number
              </button>
              <button
                onClick={() => {
                  setSortBy('alphabetical');
                  setIsSortPopupOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  sortBy === 'alphabetical' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700'
                }`}
              >
                Alphabetical
              </button>
              <button
                onClick={() => {
                  setSortBy('points');
                  setIsSortPopupOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  sortBy === 'points' ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-700'
                }`}
              >
                Points
              </button>
            </div>
          )}
        </div>
      )}

      {/* Multiple Select Button */}
      <BotNavGrayButton
        icon={<IconCheckBox />}
        label="Multiple Select"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('toggleMultiSelect'));
        }}
      />

      {/* Settings Button */}
      <div className="relative flex-shrink-0" ref={settingsButtonRef}>
        <BotNavGrayButton
          icon={<IconSettingsWheel />}
          label="Settings"
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsPopupOpen(!isSettingsPopupOpen);
          }}
          stopPropagation={true}
        />

        {/* Settings Popup */}
        {isSettingsPopupOpen && (
          <div 
            className="absolute bottom-full left-0 mb-2 bg-blue-100 rounded-lg shadow-lg border-4 border-[#4A3B8D] py-2 z-[100] min-w-[200px]"
          >
            {classId && onEditClass && (
              <button
                onClick={() => {
                  onEditClass();
                  setIsSettingsPopupOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Edit Class
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

