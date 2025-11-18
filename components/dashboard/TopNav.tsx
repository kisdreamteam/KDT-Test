'use client';

import Image from 'next/image';

interface TeacherProfile {
  title: string;
  name: string;
}

interface TopNavProps {
  isLoadingProfile: boolean;
  currentClassName: string | null;
  teacherProfile: TeacherProfile | null;
  onToggleSidebar: () => void;
}

export default function TopNav({ 
  isLoadingProfile, 
  currentClassName, 
  teacherProfile, 
  onToggleSidebar 
}: TopNavProps) {
  return (
    // Top Nav Container
    <div className="bg-white h-30 py-6 flex items-center justify-between w-full pl-11">
      {/* Hamburger Menu */}
      <button
        onClick={onToggleSidebar}
        className="text-gray-600 sm:text-xl md:text- xl lg:text-2xl hover:text-gray-800 w-8 pt-12 flex justify-start"
      >
        ☰
      </button>

      {/* Main Title */}
      <h1 className="text-5xl font-bold text-gray-900 flex-1 text-left pl-10 pt-15 font-spartan
                      sm:text-lg md:text-xl lg:text-4xl xl:text-7xl">
        {isLoadingProfile ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-2"></div>
            Loading...
          </div>
        ) : currentClassName ? (
          currentClassName
        ) : teacherProfile ? (
          `${teacherProfile.title} ${teacherProfile.name}'s Classes`
        ) : (
          "Classes"
        )}
      </h1>

      {/* KIS Points Logo */}
      <div className="flex items-center w-40 justify-end">
        <Image
          src="/images/shared/profile-avatar-dashboard.png"
          alt="KIS Points"
          width={160}
          height={80}
          className="object-contain"
        />
      </div>
    </div>
  );
}

