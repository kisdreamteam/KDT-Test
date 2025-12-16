'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { normalizeClassIconPath } from '@/lib/iconUtils';

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
}

export default function LeftNav({ classes, isLoadingClasses, viewMode, setViewMode }: LeftNavProps) {
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
      </div>

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
                  <svg
                    className="w-6 h-6 text-gray-600"
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

