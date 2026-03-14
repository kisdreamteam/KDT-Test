'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { normalizeClassIconPath } from '@/lib/iconUtils';
import IconTimerClock from '@/components/iconsCustom/iconTimerClock';
import IconEditPencil from '@/components/iconsCustom/iconEditPencil';
import type { SeatingLayoutNavData } from '@/context/SeatingLayoutNavContext';

interface Class {
  id: string;
  name: string;
  icon?: string;
  is_archived?: boolean;
}

interface LeftNavProps {
  classes: Class[];
  isLoadingClasses: boolean;
  viewMode?: 'active' | 'archived';
  setViewMode?: (mode: 'active' | 'archived') => void;
  seatingLayoutData?: SeatingLayoutNavData | null;
}

export default function LeftNav({ classes, isLoadingClasses, viewMode, setViewMode, seatingLayoutData }: LeftNavProps) {
  const router = useRouter();

  const handleAllClassesClick = () => {
    if (setViewMode) {
      setViewMode('active');
    }
    router.push('/dashboard');
  };

  // Separate active and archived classes
  const activeClasses = classes.filter(cls => !cls.is_archived);
  const hasArchivedClasses = classes.some(cls => cls.is_archived);

  const handleArchivedClassesClick = () => {
    if (setViewMode) {
      setViewMode('archived');
    }
    router.push('/dashboard');
  };
  return (
    <div className="p-4 flex flex-col h-full max-h-screen">
      {/* Top Section - Fixed */}
      <div className="flex-shrink-0">
        {/* Character Illustration */}
        <div className="bg-[#fcf1f0] rounded-4xl p-0 mb-4">
          <div className="text-center">
            <Image
              src="/images/shared/default-image.png"
              alt="User Avatar"
              width={250}
              height={250}
              className="mx-auto mb-2"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>

        {/* All Classes Button */}
        <button
          onClick={handleAllClassesClick}
          className={`w-full bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer ${
            viewMode === 'active' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#4A3B8D]' : ''
          }`}
        >
          <h2 className="text-center font-semibold">All Classes</h2>
        </button>

        

      {/* Classes List - Scrollable Area */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 bg-[#fcf1f0] rounded-xl mb-4">
        {isLoadingClasses ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading classes...</span>
          </div>
        ) : activeClasses.length === 0 && !hasArchivedClasses ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No classes yet</p>
          </div>
        ) : (
          <>
            {/* Active Classes */}
            {activeClasses.map((cls) => (
              <Link
                key={cls.id}
                href={`/dashboard/classes/${cls.id}`}
                className="block"
              >
                <div className="flex items-center space-x-3 p-2 hover:bg-blue-200 rounded cursor-pointer transition-colors">
                  {/* Class Image */}
                  <div className="w-8 h-8 flex-shrink-0">
                    <Image
                      src={normalizeClassIconPath(cls.icon)}
                      alt={`${cls.name} icon`}
                      width={32}
                      height={32}
                      className="rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xl font-medium text-gray-800 block truncate">
                      {cls.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Archived Classes - Single Item */}
            {hasArchivedClasses && (
              <div
                onClick={handleArchivedClassesClick}
                className={`flex items-center space-x-3 p-2 hover:bg-blue-200 rounded cursor-pointer transition-colors ${
                  viewMode === 'archived' ? 'bg-blue-200' : ''
                }`}
              >
                {/* Clock Icon for Archived Classes */}
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                  <IconTimerClock className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xl font-medium text-gray-800 block truncate">
                    Archived Classes
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
 
      {/* Seating chart layouts section - when viewing seating chart (not edit mode) */}
      {seatingLayoutData && (
          <>
            <div className="w-full p-3 mb-2">
              <h2 className="text-center font-semibold text-gray-800">Layouts</h2>
            </div>
            <div className="space-y-2 mb-4 max-h-90 overflow-y-auto">
              {seatingLayoutData.isLoadingLayouts ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading layouts...</span>
                </div>
              ) : seatingLayoutData.layouts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No layouts yet</p>
                </div>
              ) : (
                seatingLayoutData.layouts.map((layout) => (
                  <div key={layout.id} className="relative">
                    <button
                      onClick={() => seatingLayoutData.onSelectLayout(layout.id)}
                      className={`w-full flex items-center justify-between space-x-3 p-2 rounded cursor-pointer transition-colors ${
                        seatingLayoutData.selectedLayoutId === layout.id
                          ? 'bg-purple-400 text-white hover:bg-purple-500'
                          : 'hover:bg-blue-200'
                      }`}
                    >
                      <span className={`text-xl font-medium block truncate flex-1 min-w-0 text-left ${
                        seatingLayoutData.selectedLayoutId === layout.id ? 'text-white' : 'text-gray-800'
                      }`}>
                        Layout: {layout.name}
                      </span>
                    </button>
                    <button
                      onClick={(e) => seatingLayoutData.onEditLayout(layout.id, layout.name, e)}
                      className="absolute top-2.5 right-9 w-6 h-6 bg-gray-400 hover:bg-gray-500 text-white rounded-full flex items-center justify-center transition-colors z-10"
                      title={`Edit name: ${layout.name}`}
                    >
                      <IconEditPencil className="w-4 h-4 text-white" strokeWidth={2} />
                    </button>
                    <button
                      onClick={(e) => seatingLayoutData.onDeleteLayout(layout.id, layout.name, e)}
                      className="absolute top-2.5 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
                      title={`Delete ${layout.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>


      {/* Bottom Section - Fixed */}
      <div className="flex-shrink-0 mt-auto">
        {/* User Section */}
        <div className="bg-[#dd7f81] text-white p-3 rounded-lg mb-2">
          <div className="text-center font-semibold">
            KI-EUN
          </div>
        </div>
      </div>
    </div>
  );
}

