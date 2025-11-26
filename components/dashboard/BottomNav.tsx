'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useStudentSort } from '@/context/StudentSortContext';

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
  const { sortBy, setSortBy } = useStudentSort();
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [hasRecentlySelected, setHasRecentlySelected] = useState(false);
  const [leftPosition, setLeftPosition] = useState(0);
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);
  const [sortPopupPosition, setSortPopupPosition] = useState({ left: 0, bottom: 0 });
  const sortButtonRef = useRef<HTMLDivElement>(null);

  // Check for recently selected data in localStorage
  const checkRecentlySelected = () => {
    const lastSelectedClasses = localStorage.getItem('lastSelectedClasses');
    const lastSelectedStudents = localStorage.getItem('lastSelectedStudents');
    const hasData = !!(lastSelectedClasses || lastSelectedStudents);
    setHasRecentlySelected(hasData);
  };

  // Listen for multi-select state changes from components
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      // Defer state update to avoid updating during render
      setTimeout(() => {
        setIsMultiSelectMode(event.detail.isMultiSelect);
        // Check for recently selected data when entering multi-select mode
        if (event.detail.isMultiSelect) {
          checkRecentlySelected();
        }
      }, 0);
    };

    const handleSelectionCountChange = (event: CustomEvent) => {
      // Defer state update to avoid updating during render
      setTimeout(() => {
        setSelectedCount(event.detail.count || 0);
      }, 0);
    };

    // Listen for localStorage changes (when recently selected data is cleared or updated)
    const handleStorageChange = () => {
      checkRecentlySelected();
    };

    // Check initially
    checkRecentlySelected();

    window.addEventListener('multiSelectStateChanged', handleStateChange as EventListener);
    window.addEventListener('selectionCountChanged', handleSelectionCountChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('recentlySelectedCleared', handleStorageChange);
    window.addEventListener('recentlySelectedUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('multiSelectStateChanged', handleStateChange as EventListener);
      window.removeEventListener('selectionCountChanged', handleSelectionCountChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('recentlySelectedCleared', handleStorageChange);
      window.removeEventListener('recentlySelectedUpdated', handleStorageChange);
    };
  }, []);

  // Dynamically calculate left position to match TopNav alignment
  useEffect(() => {
    let rafId: number | null = null;
    let lastPosition = -1;
    let isUpdating = false;

    const updateLeftPosition = () => {
      if (isUpdating) return;
      isUpdating = true;

      requestAnimationFrame(() => {
        // Find the TopNav element
        const topNav = document.querySelector('[data-top-nav]') as HTMLElement;
        if (topNav) {
          const rect = topNav.getBoundingClientRect();
          const newPosition = rect.left;
          // Only update if position actually changed (avoid unnecessary re-renders)
          if (Math.abs(newPosition - lastPosition) > 0.1) {
            setLeftPosition(newPosition);
            lastPosition = newPosition;
          }
        } else {
          // Fallback calculation if TopNav not found
          const baseLeft = 8; // Outer container pl-2
          const sidebarWidth = sidebarOpen ? 304 : 0; // w-76 = 304px
          const mainContentPadding = 8; // Main content pl-2
          const topNavPadding = 28; // TopNav pl-7
          const newPosition = baseLeft + sidebarWidth + mainContentPadding + topNavPadding;
          if (Math.abs(newPosition - lastPosition) > 0.1) {
            setLeftPosition(newPosition);
            lastPosition = newPosition;
          }
        }
        isUpdating = false;
      });
    };

    // Throttled continuous update - check every few frames instead of every frame
    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateLeftPosition();
        rafId = null;
        // Schedule next update after a short delay
        setTimeout(() => {
          if (rafId === null) {
            scheduleUpdate();
          }
        }, 16); // ~60fps
      });
    };

    // Start the update loop
    scheduleUpdate();

    // Initial calculation
    updateLeftPosition();

    // Update on window resize and zoom
    const handleResize = () => {
      updateLeftPosition();
      scheduleUpdate();
    };
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to watch for layout changes (including zoom)
    let resizeObserver: ResizeObserver | null = null;
    const topNav = document.querySelector('[data-top-nav]') as HTMLElement;
    if (topNav && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateLeftPosition();
        scheduleUpdate();
      });
      resizeObserver.observe(topNav);
    }

    // Also watch for sidebar container changes
    let sidebarObserver: ResizeObserver | null = null;
    const sidebarContainer = document.querySelector('[data-sidebar-container]') as HTMLElement;
    if (sidebarContainer && typeof ResizeObserver !== 'undefined') {
      sidebarObserver = new ResizeObserver(() => {
        updateLeftPosition();
        scheduleUpdate();
      });
      sidebarObserver.observe(sidebarContainer);
    }

    // Watch for zoom changes using visualViewport API if available
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      const handleViewportChange = () => {
        updateLeftPosition();
        scheduleUpdate();
      };
      visualViewport.addEventListener('resize', handleViewportChange);
      visualViewport.addEventListener('scroll', handleViewportChange);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        window.removeEventListener('resize', handleResize);
        if (visualViewport) {
          visualViewport.removeEventListener('resize', handleViewportChange);
          visualViewport.removeEventListener('scroll', handleViewportChange);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (sidebarObserver) {
          sidebarObserver.disconnect();
        }
      };
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (sidebarObserver) {
        sidebarObserver.disconnect();
      }
    };
  }, [sidebarOpen]);

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

  // Update popup position when it opens
  useEffect(() => {
    if (isSortPopupOpen && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortPopupPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8, // 8px gap (0.5rem)
      });
    }
  }, [isSortPopupOpen]);

  // Close sort popup when clicking outside
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
  
  return (
    // Bottom Nav Container - Fixed at bottom, aligned with TopNav
    <div 
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 transition-all duration-300 border-t border-[#4A3B8D] overflow-hidden"
      style={{ left: `${leftPosition}px`, right: '0.5rem' }}>
      {!isMultiSelectMode ? (
        // Normal mode buttons
        <>
          {/* Toolkit Button */}
          <div className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
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
            <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Toolkit</h2>
          </div>

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
                {/* Sort icon - same as TopNav */}
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

              {/* Sort Popup - opens upward since it's in bottom nav */}
              {isSortPopupOpen && (
                <div 
                  className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[100] min-w-[200px]"
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
                </div>
              )}
            </div>
          )}

          {/* Multiple Select Button */}
          <div 
            onClick={() => {
              // Dispatch custom event to toggle multi-select mode
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
        </>
      ) : (
        // Multi-select mode buttons
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
      )}
    </div>
  );
}
