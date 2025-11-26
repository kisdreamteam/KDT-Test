'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(72); // Default 4.5rem (72px)

  // Get the text content
  const getTitleText = useCallback(() => {
    if (isLoadingProfile) return 'Loading...';
    if (currentClassName) return currentClassName;
    if (teacherProfile) return `${teacherProfile.title} ${teacherProfile.name.split(' ')[0]}'s Classes`;
    return 'Classes';
  }, [isLoadingProfile, currentClassName, teacherProfile]);

  // Calculate and adjust font size based on container width
  useEffect(() => {
    const adjustFontSize = () => {
      if (!titleRef.current || !titleContainerRef.current) return;

      const container = titleContainerRef.current;
      const textElement = titleRef.current;
      const containerWidth = container.offsetWidth;
      
      // Start with a large font size and reduce until it fits
      let size = 72; // Start at 4.5rem
      textElement.style.fontSize = `${size}px`;
      
      // Binary search for the optimal font size
      let minSize = 14; // Minimum 0.875rem
      let maxSize = 72; // Maximum 4.5rem
      
      while (minSize <= maxSize) {
        const testSize = Math.floor((minSize + maxSize) / 2);
        textElement.style.fontSize = `${testSize}px`;
        
        if (textElement.scrollWidth <= containerWidth) {
          size = testSize;
          minSize = testSize + 1;
        } else {
          maxSize = testSize - 1;
        }
      }
      
      setFontSize(size);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      adjustFontSize();
    }, 0);
    
    // Adjust on window resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        adjustFontSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && titleContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        adjustFontSize();
      });
      resizeObserver.observe(titleContainerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isLoadingProfile, currentClassName, teacherProfile, getTitleText]);

  return (
    // Top Nav Container
    <div className="bg-white h-30 py-6 flex flex-row items-center justify-between w-full pl-7 pt-8" data-top-nav>
      {/* <div className="bg-white flex flex-col items-start justify-start"> */}
      <div className="bg-white flex flex-row items-start justify-start flex-1 min-w-0">
        {/* Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="text-gray-600 sm:text-xl md:text- xl lg:text-2xl hover:text-gray-800 w-8 pt-5 flex justify-start flex-shrink-0"
        >
          ☰
        </button>

          {/* Main Title Container */}
          <div ref={titleContainerRef} className="flex-1 min-w-0 overflow-hidden pl-10 pt-0">
            <h1 
              ref={titleRef}
              className="font-bold text-gray-900 text-left font-spartan whitespace-nowrap"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.2',
              }}
            >
              {isLoadingProfile ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-2"></div>
                  Loading...
                </span>
              ) : currentClassName ? (
                currentClassName
              ) : teacherProfile ? (
                `${teacherProfile.title} ${teacherProfile.name.split(' ')[0]}'s Classes`
              ) : (
                "Classes"
              )}
            </h1>
          </div>
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

