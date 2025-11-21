'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useStudentSort } from '@/context/StudentSortContext';

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
  const { sortBy, setSortBy } = useStudentSort();
  const [isSortPopupOpen, setIsSortPopupOpen] = useState(false);
  const sortButtonRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
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
    // Top Nav Container
    <div className="bg-white h-30 py-6 flex flex-row items-center justify-between w-full pl-7 pt-8">
      {/* <div className="bg-white flex flex-col items-start justify-start"> */}
      <div className="bg-white flex flex-row items-start justify-start">
        {/* Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 sm:text-xl md:text- xl lg:text-2xl hover:text-gray-800 w-8 pt-5 flex justify-start"
        >
          ☰
        </button>
        {/* Sort Button - Only show when on a class page */}
        {currentClassName && (
          <div className="relative" ref={sortButtonRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSortPopupOpen(!isSortPopupOpen);
              }}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors pl-6 pt-6"
              title="Sort by"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            </button>

            {/* Sort Popup */}
            {isSortPopupOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]">
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

          {/* Main Title */}
          <h1 className="text-5xl font-bold text-gray-900 flex-1 text-left pl-10 pt-0 font-spartan
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
        </div>
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

