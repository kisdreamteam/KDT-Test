'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import IconRandomArrows from '@/components/iconsCustom/iconRandomArrows';
import IconSettingsWheel from '@/components/iconsCustom/iconSettingsWheel';

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
  const [colorByGender, setColorByGender] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ left: 0, bottom: 0 });
  const settingsButtonRef = useRef<HTMLDivElement>(null);
  const [isAddGroupsMenuOpen, setIsAddGroupsMenuOpen] = useState(false);
  const [addGroupsMenuPosition, setAddGroupsMenuPosition] = useState({ left: 0, bottom: 0 });
  const addGroupsButtonRef = useRef<HTMLDivElement>(null);
  
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

  // Update add groups menu position when it opens
  useEffect(() => {
    if (isAddGroupsMenuOpen && addGroupsButtonRef.current) {
      const rect = addGroupsButtonRef.current.getBoundingClientRect();
      setAddGroupsMenuPosition({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
  }, [isAddGroupsMenuOpen]);

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

  // Close add groups menu when clicking outside
  useEffect(() => {
    if (!isAddGroupsMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addGroupsButtonRef.current && !addGroupsButtonRef.current.contains(e.target as Node)) {
        const menu = document.querySelector('[data-add-groups-menu]');
        if (menu && !menu.contains(e.target as Node)) {
          setIsAddGroupsMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isAddGroupsMenuOpen]);

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

  const handleAddGroups = (numGroups: number) => {
    window.dispatchEvent(new CustomEvent('seatingChartAddMultipleGroups', { 
      detail: { numGroups } 
    }));
    setIsAddGroupsMenuOpen(false);
  };

  const handleAutoAssignSeats = () => {
    window.dispatchEvent(new CustomEvent('seatingChartAutoAssignSeats'));
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
                <IconSettingsWheel />
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
                  
                  {/* Color by Gender Toggle */}
                  <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-50">
                    <span className="text-sm text-gray-700 font-medium">Color by Gender</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValue = !colorByGender;
                        setColorByGender(newValue);
                        window.dispatchEvent(new CustomEvent('seatingChartColorCodeBy', { 
                          detail: { colorCodeBy: newValue ? 'Gender' : 'Level' } 
                        }));
                      }}
                      disabled={isLoadingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        colorByGender ? 'bg-purple-600' : 'bg-gray-300'
                      } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          colorByGender ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Color by Level Toggle (Disabled) */}
                  <div className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 opacity-50">
                    <span className="text-sm text-gray-700 font-medium">Color by Level</span>
                    <button
                      disabled
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-300 cursor-not-allowed"
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Groups Button */}
          {currentClassName && (
            <div className="relative flex-shrink-0" ref={addGroupsButtonRef}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddGroupsMenuOpen(!isAddGroupsMenuOpen);
                }}
                className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2"
              >
                {/* Add/Plus icon */}
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
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
                <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Add Groups</h2>
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isAddGroupsMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              
              {/* Add Groups Dropdown Menu */}
              {isAddGroupsMenuOpen && (
                <div
                  data-add-groups-menu
                  className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[160px] py-2"
                  style={{
                    left: `${addGroupsMenuPosition.left}px`,
                    bottom: `${addGroupsMenuPosition.bottom}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddGroups(num);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors"
                    >
                      {num} Groups
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auto Assign Seats Button */}
          {currentClassName && (
            <div 
              onClick={handleAutoAssignSeats}
              className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
            >
              {/* Auto Assign icon */}
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <h2 className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Auto Assign Seats</h2>
            </div>
          )}

          {/* Randomize Button */}
          <div 
            onClick={handleRandomizeSeating}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] bg-white text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Shuffle/Randomize icon */}
            <IconRandomArrows />
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
                <IconSettingsWheel />
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
        
        {/* Right side - Add Group Button */}
        <div className="flex items-center">
          <div 
            onClick={() => handleAddGroups(1)}
            className="w-16 sm:w-24 md:w-32 lg:w-[200px] rounded-xl bg-red-400 text-white p-1 sm:p-2 md:p-2.5 lg:p-3 hover:bg-pink-50 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0"
          >
            {/* Add/Plus icon */}
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
                d="M12 4v16m8-8H4" 
              />
            </svg>
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Add group</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

