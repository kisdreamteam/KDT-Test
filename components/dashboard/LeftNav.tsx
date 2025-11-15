'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  icon?: string;
}

interface LeftNavProps {
  classes: Class[];
  isLoadingClasses: boolean;
  teacherCount: number | null;
}

export default function LeftNav({ classes, isLoadingClasses, teacherCount }: LeftNavProps) {
  return (
    <div className="p-4 flex flex-col h-full">
      {/* Character Illustration */}
      <div className="bg-[#fcf1f0] rounded-4xl p-0 mb-4">
        <div className="text-center">
          <Image
            src="/images/shared/default-image.png"
            alt="User Avatar"
            width={250}
            height={250}
            className="mx-auto mb-2"
          />
        </div>
      </div>

      {/* All Classes Button */}
      <Link href="/dashboard" className="block">
        <div className="bg-[#4A3B8D] text-white p-3 rounded-lg mb-4 hover:bg-blue-800 transition-colors cursor-pointer">
          <h2 className="text-center font-semibold">All Classes</h2>
        </div>
      </Link>

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
              <div className="flex items-center space-x-3 p-2 hover:bg-purple-300 rounded cursor-pointer transition-colors">
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

      {/* User Section */}
      <div className="mt-auto">
        <div className="bg-[#dd7f81] text-white p-3 rounded-lg mb-2">
          <div className="text-center font-semibold">
            KI-EUN
          </div>
        </div>
        <div className="text-center text-sm text-gray-600">
          {teacherCount !== null 
            ? `${teacherCount} ${teacherCount === 1 ? 'teacher' : 'teachers'}`
            : 'Loading...'
          }
        </div>
      </div>
    </div>
  );
}

