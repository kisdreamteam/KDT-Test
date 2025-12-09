'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface BottomNavSeatingEditProps {
  currentClassName: string | null;
  sidebarOpen: boolean;
}

export default function BottomNavSeatingEdit({ 
  currentClassName,
  sidebarOpen: _sidebarOpen
}: BottomNavSeatingEditProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isViewSettingsMenuOpen, setIsViewSettingsMenuOpen] = useState(false);
  const [viewSettingsMenuPosition, setViewSettingsMenuPosition] = useState({ left: 0, bottom: 0 });
  const viewSettingsButtonRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [teachersDeskLeft, setTeachersDeskLeft] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ left: 0, bottom: 0 });
  const settingsButtonRef = useRef<HTMLDivElement>(null);
  
  // Get layout ID from URL
  const layoutId = searchParams.get('layout');

  // Fetch current layout settings from database
  useEffect(() => {
    const fetchLayoutSettings = async () => {
      if (!layoutId) return;
      
      try {
        setIsLoadingSettings(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('seating_charts')
          .select('show_grid, show_objects, layout_orientation')
          .eq('id', layoutId)
          .single();

        if (error) {
          console.error('Error fetching layout settings:', error);
          return;
        }

        if (data) {
          // Set initial values from database (default to true/Left if null)
          setShowGrid(data.show_grid ?? true);
          setShowFurniture(data.show_objects ?? true);
          setTeachersDeskLeft(data.layout_orientation === 'Left' || data.layout_orientation === null);
        }
      } catch (err) {
        console.error('Unexpected error fetching layout settings:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchLayoutSettings();
  }, [layoutId]);

  // Update show_grid in database
  const handleToggleShowGrid = async (newValue: boolean) => {
    if (!layoutId) return;
    
    setShowGrid(newValue);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('seating_charts')
        .update({ show_grid: newValue })
        .eq('id', layoutId);

      if (error) {
        console.error('Error updating show_grid:', error);
        // Revert on error
        setShowGrid(!newValue);
      }
    } catch (err) {
      console.error('Unexpected error updating show_grid:', err);
      // Revert on error
      setShowGrid(!newValue);
    }
  };

  // Update show_objects in database
  const handleToggleShowFurniture = async (newValue: boolean) => {
    if (!layoutId) return;
    
    setShowFurniture(newValue);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('seating_charts')
        .update({ show_objects: newValue })
        .eq('id', layoutId);

      if (error) {
        console.error('Error updating show_objects:', error);
        // Revert on error
        setShowFurniture(!newValue);
      }
    } catch (err) {
      console.error('Unexpected error updating show_objects:', err);
      // Revert on error
      setShowFurniture(!newValue);
    }
  };

  // Update layout_orientation in database
  const handleToggleTeachersDeskLeft = async (newValue: boolean) => {
    if (!layoutId) return;
    
    setTeachersDeskLeft(newValue);
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('seating_charts')
        .update({ layout_orientation: newValue ? 'Left' : 'Right' })
        .eq('id', layoutId);

      if (error) {
        console.error('Error updating layout_orientation:', error);
        // Revert on error
        setTeachersDeskLeft(!newValue);
      }
    } catch (err) {
      console.error('Unexpected error updating layout_orientation:', err);
      // Revert on error
      setTeachersDeskLeft(!newValue);
    }
  };

  // Update view settings menu position when it opens
  useEffect(() => {
    if (isViewSettingsMenuOpen && viewSettingsButtonRef.current) {
      const rect = viewSettingsButtonRef.current.getBoundingClientRect();
      setViewSettingsMenuPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isViewSettingsMenuOpen]);

  // Update settings menu position when it opens
  useEffect(() => {
    if (isSettingsMenuOpen && settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSettingsMenuPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isSettingsMenuOpen]);

  // Close view settings menu when clicking outside
  useEffect(() => {
    if (!isViewSettingsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (viewSettingsButtonRef.current && !viewSettingsButtonRef.current.contains(e.target as Node)) {
        const menu = document.querySelector('[data-view-settings-menu]');
        if (menu && !menu.contains(e.target as Node)) {
          setIsViewSettingsMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isViewSettingsMenuOpen]);

  // Close settings menu when clicking outside
  useEffect(() => {
    if (!isSettingsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsButtonRef.current && !settingsButtonRef.current.contains(e.target as Node)) {
        const menu = document.querySelector('[data-settings-menu]');
        if (menu && !menu.contains(e.target as Node)) {
          setIsSettingsMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isSettingsMenuOpen]);

  const handleRandomizeSeating = () => {
    window.dispatchEvent(new CustomEvent('seatingChartRandomize'));
  };

  const handleClearAllGroups = () => {
    window.dispatchEvent(new CustomEvent('seatingChartClearAllGroups'));
    setIsSettingsMenuOpen(false);
  };

  const handleDeleteAllGroups = () => {
    window.dispatchEvent(new CustomEvent('seatingChartDeleteAllGroups'));
    setIsSettingsMenuOpen(false);
  };

  const handleSaveSeatingChanges = () => {
    window.dispatchEvent(new CustomEvent('seatingChartSave'));
    window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: false } }));
    // Remove mode parameter from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('mode');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };

  return (
    <div 
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 transition-all duration-300 border-t border-[#4A3B8D] overflow-hidden"
      style={{ left: 0, right: 0, width: '100vw' }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left side buttons */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 md:gap-8 lg:gap-15">
          {/* View Settings Button */}
          {currentClassName && (
            <div className="relative flex-shrink-0" ref={viewSettingsButtonRef}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewSettingsMenuOpen(!isViewSettingsMenuOpen);
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
                <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">View Settings</h2>
              </div>
              
              {/* View Settings Dropdown Menu */}
              {isViewSettingsMenuOpen && (
                <div
                  data-view-settings-menu
                  className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[220px] py-2"
                  style={{
                    left: `${viewSettingsMenuPosition.left}px`,
                    bottom: `${viewSettingsMenuPosition.bottom}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Show Grid Toggle */}
                  <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                    <span className="text-sm text-gray-700 font-medium">Show Grid</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleShowGrid(!showGrid);
                      }}
                      disabled={isLoadingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showGrid ? 'bg-purple-600' : 'bg-gray-300'
                      } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showGrid ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Show Furniture Toggle */}
                  <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                    <span className="text-sm text-gray-700 font-medium">Show Furniture</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleShowFurniture(!showFurniture);
                      }}
                      disabled={isLoadingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showFurniture ? 'bg-purple-600' : 'bg-gray-300'
                      } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showFurniture ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Teacher's Desk Left Toggle */}
                  <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                    <span className="text-sm text-gray-700 font-medium">Teacher's Desk Left</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTeachersDeskLeft(!teachersDeskLeft);
                      }}
                      disabled={isLoadingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        teachersDeskLeft ? 'bg-purple-600' : 'bg-gray-300'
                      } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          teachersDeskLeft ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Randomize Button */}
          <div 
            onClick={handleRandomizeSeating}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Shuffle/Randomize icon */}
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
            <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Randomize Seats</h2>
          </div>

          {/* Settings Button */}
          {currentClassName && (
            <div className="relative flex-shrink-0" ref={settingsButtonRef}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsMenuOpen(!isSettingsMenuOpen);
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
              
              {/* Settings Dropdown Menu */}
              {isSettingsMenuOpen && (
                <div
                  data-settings-menu
                  className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[220px] py-2"
                  style={{
                    left: `${settingsMenuPosition.left}px`,
                    bottom: `${settingsMenuPosition.bottom}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Clear All Groups Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAllGroups();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                  >
                    Clear All Groups
                  </button>
                  
                  {/* Delete All Groups Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAllGroups();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors"
                  >
                    Delete All Groups
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right side - Exit Edit Mode Button */}
        <div className="flex items-center">
          <div 
            onClick={handleSaveSeatingChanges}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-purple-800 text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-purple-900 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0 rounded-xl"
          >
            {/* Exit/Arrow icon */}
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
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Exit Editor Mode</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

