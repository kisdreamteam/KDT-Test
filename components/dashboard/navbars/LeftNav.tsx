'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Class {
  id: string;
  name: string;
  icon?: string;
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

  const handleArchivedClassesClick = () => {
    if (setViewMode) {
      setViewMode('archived');
    }
    router.push('/dashboard');
  };
  return (
    <div className="p-4 flex flex-col h-full max-h-screen overflow-y-auto">
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

      {/* Classes List */}
      <div className="space-y-2 mb-6 max-h-90 overflow-y-auto">
        {isLoadingClasses ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading classes...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No classes yet</p>
          </div>
        ) : (
          classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/dashboard/classes/${cls.id}`}
              className="block"
            >
              <div className="flex items-center space-x-3 p-2 hover:bg-blue-200 rounded cursor-pointer transition-colors">
                {/* Class Image */}
                <div className="w-8 h-8 flex-shrink-0">
                  <Image
                    src={cls.icon || "/images/1Landing Page Image.png"}
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
          ))
        )}
      </div>

      {/* Archived Classes Button */}
      <button
        onClick={handleArchivedClassesClick}
        className={`w-full bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer ${
          viewMode === 'archived' ? 'ring-2 ring-white ring-offset-2 ring-offset-[#4A3B8D]' : ''
        }`}
      >
        <h2 className="text-center font-semibold">Archived Classes</h2>
      </button>

      {/* User Section */}
      <div className="mt-auto">
        <div className="bg-[#dd7f81] text-white p-3 rounded-lg mb-2">
          <div className="text-center font-semibold">
            KI-EUN
          </div>
        </div>
      </div>
    </div>
  );
}

