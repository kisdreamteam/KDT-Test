'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useStudentSort } from '@/context/StudentSortContext';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';
import ViewPopup from './ViewPopup';

interface BottomNavStudentsProps {
  currentClassName: string | null;
  sidebarOpen: boolean;
  onTimerClick: () => void;
  onRandomClick: () => void;
}

export default function BottomNavStudents({ 
  currentClassName, 
  sidebarOpen,
  onTimerClick,
  onRandomClick
}: BottomNavStudentsProps) {
  const { sortBy, setSortBy } = useStudentSort();
  const router = useRouter();
  const leftPosition = useBottomNavPosition(sidebarOpen);
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);
  const [sortPopupPosition, setSortPopupPosition] = useState({ left: 0, bottom: 0 });
  const sortButtonRef = useRef<HTMLDivElement>(null);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [settingsPopupPosition, setSettingsPopupPosition] = useState({ left: 0, bottom: 0 });
  const settingsButtonRef = useRef<HTMLDivElement>(null);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const [viewPopupPosition, setViewPopupPosition] = useState({ left: 0, bottom: 0 });
  const viewButtonRef = useRef<HTMLDivElement>(null);

  // Update popup positions when they open
  useEffect(() => {
    if (isSortPopupOpen && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortPopupPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isSortPopupOpen]);

  useEffect(() => {
    if (isSettingsPopupOpen && settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSettingsPopupPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isSettingsPopupOpen]);

  useEffect(() => {
    if (isViewPopupOpen && viewButtonRef.current) {
      const rect = viewButtonRef.current.getBoundingClientRect();
      setViewPopupPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isViewPopupOpen]);

  // Close popups when clicking outside
  useEffect(() => {
    if (!isSortPopupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sortButtonRef.current && !sortButtonRef.current.contains(e.target as Node)) {
        setIsSortPopupOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isSortPopupOpen]);

  useEffect(() => {
    if (!isSettingsPopupOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsButtonRef.current && !settingsButtonRef.current.contains(e.target as Node)) {
        setIsSettingsPopupOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isSettingsPopupOpen]);

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
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 transition-all duration-300 border-t border-[#4A3B8D] overflow-hidden"
      style={{ left: `${leftPosition}px`, right: '0.5rem' }}
    >
      {/* View Button - Only show when on a class page */}
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
            <svg 
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-gray-400" 
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
            <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">View</h2>
          </div>
          <ViewPopup 
            isOpen={isViewPopupOpen} 
            position={viewPopupPosition} 
            onClose={() => setIsViewPopupOpen(false)} 
          />
        </div>
      )}

      {/* Random Button */}
      <div 
        onClick={onRandomClick}
        className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
      >
        {/* Shuffle icon */}
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
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
          />
        </svg>
        <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Random</h2>
      </div>

      {/* Timer Button */}
      <div 
        onClick={onTimerClick}
        className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
      >
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Timer</h2>
      </div>

      {/* Sorting Button - Only show when on a class page */}
      {currentClassName && (
        <div className="relative flex-shrink-0" ref={sortButtonRef}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsSortPopupOpen(!isSortPopupOpen);
            }}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2"
          >
            {/* Sort icon */}
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
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Sorting</h2>
          </div>

          {/* Sort Popup */}
          {isSortPopupOpen && (
            <div 
              className="fixed bg-blue-100 rounded-lg shadow-lg border-4 border-[#4A3B8D] py-2 z-[100] min-w-[200px]"
              style={{ 
                left: `${sortPopupPosition.left}px`,
                bottom: `${sortPopupPosition.bottom}px`,
              }}
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
      <div 
        onClick={() => {
          window.dispatchEvent(new CustomEvent('toggleMultiSelect'));
        }}
        className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
      >
        {/* Checkbox with checkmark icon */}
        <svg 
          className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-gray-400" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
          <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Multiple Select</h2>
      </div>

      {/* Settings Button */}
      <div className="relative flex-shrink-0" ref={settingsButtonRef}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsPopupOpen(!isSettingsPopupOpen);
          }}
          className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2"
        >
          {/* Settings/Gear icon */}
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Settings</h2>
        </div>

        {/* Settings Popup */}
        {isSettingsPopupOpen && (
          <div 
            className="fixed bg-blue-100 rounded-lg shadow-lg border-4 border-[#4A3B8D] py-2 z-[100] min-w-[200px]"
            style={{ 
              left: `${settingsPopupPosition.left}px`,
              bottom: `${settingsPopupPosition.bottom}px`,
            }}
          >
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

