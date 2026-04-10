'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBottomNavPosition } from '@/hooks/useBottomNavPosition';
import IconRandomArrows from '@/components/iconsCustom/iconRandomArrows';
import IconSettingsWheel from '@/components/iconsCustom/iconSettingsWheel';
import IconAutoAssign from '@/components/iconsCustom/iconAutoAssign';
import IconAddPlus from '@/components/iconsCustom/iconAddPlus';
import BotNavGrayButton from './botNavGrayButton';

interface BottomNavSeatingEditProps {
  currentClassName: string | null;
  sidebarOpen: boolean;
  /** Current class ID (when on a class page) for opening Edit Class modal */
  classId?: string | null;
  /** Called when user chooses Edit Class from settings menu */
  onEditClass?: () => void;
}

export default function BottomNavSeatingEdit({ 
  currentClassName,
  sidebarOpen,
  classId = null,
  onEditClass,
}: BottomNavSeatingEditProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const leftPosition = useBottomNavPosition(sidebarOpen);
  const [isViewSettingsMenuOpen, setIsViewSettingsMenuOpen] = useState(false);
  const viewSettingsButtonRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showFurniture, setShowFurniture] = useState(true);
  const [teachersDeskLeft, setTeachersDeskLeft] = useState(true);
  const [colorByGender, setColorByGender] = useState(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLDivElement>(null);
  const [isAddGroupsMenuOpen, setIsAddGroupsMenuOpen] = useState(false);
  const addGroupsButtonRef = useRef<HTMLDivElement>(null);
  
  // Get layout ID from URL
  const layoutId = searchParams.get('layout');

  const emitViewSettingsChanged = (partial: {
    show_grid?: boolean;
    show_objects?: boolean;
    layout_orientation?: 'Left' | 'Right';
  }) => {
    if (!layoutId) return;
    window.dispatchEvent(
      new CustomEvent('seatingChartViewSettingsChanged', {
        detail: {
          layoutId,
          ...partial,
        },
      })
    );
  };

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
        return;
      }
      emitViewSettingsChanged({ show_grid: newValue });
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
        return;
      }
      emitViewSettingsChanged({ show_objects: newValue });
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
        return;
      }
      emitViewSettingsChanged({ layout_orientation: newValue ? 'Left' : 'Right' });
    } catch (err) {
      console.error('Unexpected error updating layout_orientation:', err);
      // Revert on error
      setTeachersDeskLeft(!newValue);
    }
  };

  useEffect(() => {
    if (!isViewSettingsMenuOpen && !isSettingsMenuOpen && !isAddGroupsMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        isViewSettingsMenuOpen &&
        viewSettingsButtonRef.current &&
        !viewSettingsButtonRef.current.contains(target)
      ) {
        setIsViewSettingsMenuOpen(false);
      }

      if (
        isSettingsMenuOpen &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(target)
      ) {
        setIsSettingsMenuOpen(false);
      }

      if (
        isAddGroupsMenuOpen &&
        addGroupsButtonRef.current &&
        !addGroupsButtonRef.current.contains(target)
      ) {
        setIsAddGroupsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [isViewSettingsMenuOpen, isSettingsMenuOpen, isAddGroupsMenuOpen]);

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
    window.dispatchEvent(
      new CustomEvent('seatingChartSave', {
        detail: {
          onSaveComplete: () => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('mode');
            const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
            router.push(newUrl);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('seatingChartEditMode', { detail: { isEditMode: false } }));
            }, 100);
          },
        },
      })
    );
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
      className="fixed bottom-0 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15 pr-4 sm:pr-6 md:pr-8 lg:pr-10 z-50 border-t border-[#4A3B8D] overflow-visible"
      style={{ left: `${leftPosition}px`, right: '0.5rem' }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left side buttons */}
        <div className="flex flex-row items-center gap-2 sm:gap-4 md:gap-8 lg:gap-15">
          {/* View Settings Button */}
          {currentClassName && (
            <div className="relative flex-shrink-0" ref={viewSettingsButtonRef}>
              <BotNavGrayButton
                icon={<IconSettingsWheel />}
                label="View Settings"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsViewSettingsMenuOpen(!isViewSettingsMenuOpen);
                }}
                stopPropagation={true}
              />
              
              {/* View Settings Dropdown Menu */}
              {isViewSettingsMenuOpen && (
                <div
                  data-view-settings-menu
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[220px] py-2"
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showGrid ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showFurniture ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        teachersDeskLeft ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
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
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        colorByGender ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
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
              <BotNavGrayButton
                icon={<IconAddPlus />}
                label="Add Groups"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddGroupsMenuOpen(!isAddGroupsMenuOpen);
                }}
                stopPropagation={true}
              />
              
              {/* Add Groups Dropdown Menu */}
              {isAddGroupsMenuOpen && (
                <div
                  data-add-groups-menu
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[160px] py-2"
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
            <BotNavGrayButton
              icon={<IconAutoAssign />}
              label="Auto Assign Seats"
              onClick={handleAutoAssignSeats}
            />
          )}

          {/* Randomize Button */}
          <BotNavGrayButton
            icon={<IconRandomArrows />}
            label="Randomize Seats"
            onClick={handleRandomizeSeating}
          />

          {/* Settings Button */}
          {currentClassName && (
            <div className="relative flex-shrink-0" ref={settingsButtonRef}>
              <BotNavGrayButton
                icon={<IconSettingsWheel />}
                label="Settings"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsMenuOpen(!isSettingsMenuOpen);
                }}
                stopPropagation={true}
              />
              
              {/* Settings Dropdown Menu */}
              {isSettingsMenuOpen && (
                <div
                  data-settings-menu
                  className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[220px] py-2"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Edit Class Option */}
                  {classId && onEditClass && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClass();
                        setIsSettingsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                    >
                      Edit Class
                    </button>
                  )}
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
            <IconAddPlus className="w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-white" />
            <h2 className="font-semibold text-white text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline">Add group</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

