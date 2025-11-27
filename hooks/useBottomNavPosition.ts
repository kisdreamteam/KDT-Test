'use client';

import { useState, useEffect } from 'react';

export function useBottomNavPosition(sidebarOpen: boolean) {
  const [leftPosition, setLeftPosition] = useState(0);

  useEffect(() => {
    let rafId: number | null = null;
    let lastPosition = -1;
    let isUpdating = false;

    const updateLeftPosition = () => {
      if (isUpdating) return;
      isUpdating = true;

      requestAnimationFrame(() => {
        const topNav = document.querySelector('[data-top-nav]') as HTMLElement;
        if (topNav) {
          const rect = topNav.getBoundingClientRect();
          const newPosition = rect.left;
          // Only update if position actually changed (avoid unnecessary re-renders)
          if (Math.abs(newPosition - lastPosition) > 0.1) {
            setLeftPosition(newPosition);
            lastPosition = newPosition;
          }
        } else {
          // Fallback calculation if TopNav not found
          const baseLeft = 8; // Outer container pl-2
          const sidebarWidth = sidebarOpen ? 304 : 0; // w-76 = 304px
          const mainContentPadding = 8; // Main content pl-2
          const topNavPadding = 28; // TopNav pl-7
          const newPosition = baseLeft + sidebarWidth + mainContentPadding + topNavPadding;
          if (Math.abs(newPosition - lastPosition) > 0.1) {
            setLeftPosition(newPosition);
            lastPosition = newPosition;
          }
        }
        isUpdating = false;
      });
    };

    // Throttled continuous update - check every few frames instead of every frame
    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateLeftPosition();
        rafId = null;
        // Schedule next update after a short delay
        setTimeout(() => {
          if (rafId === null) {
            scheduleUpdate();
          }
        }, 16); // ~60fps
      });
    };

    // Start the update loop
    scheduleUpdate();

    // Initial calculation
    updateLeftPosition();

    // Update on window resize and zoom
    const handleResize = () => {
      updateLeftPosition();
      scheduleUpdate();
    };
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to watch for layout changes (including zoom)
    let resizeObserver: ResizeObserver | null = null;
    const topNav = document.querySelector('[data-top-nav]') as HTMLElement;
    if (topNav && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateLeftPosition();
        scheduleUpdate();
      });
      resizeObserver.observe(topNav);
    }

    // Also watch for sidebar container changes
    let sidebarObserver: ResizeObserver | null = null;
    const sidebarContainer = document.querySelector('[data-sidebar-container]') as HTMLElement;
    if (sidebarContainer && typeof ResizeObserver !== 'undefined') {
      sidebarObserver = new ResizeObserver(() => {
        updateLeftPosition();
        scheduleUpdate();
      });
      sidebarObserver.observe(sidebarContainer);
    }

    // Watch for zoom changes using visualViewport API if available
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      const handleViewportChange = () => {
        updateLeftPosition();
        scheduleUpdate();
      };
      visualViewport.addEventListener('resize', handleViewportChange);
      visualViewport.addEventListener('scroll', handleViewportChange);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        window.removeEventListener('resize', handleResize);
        if (visualViewport) {
          visualViewport.removeEventListener('resize', handleViewportChange);
          visualViewport.removeEventListener('scroll', handleViewportChange);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (sidebarObserver) {
          sidebarObserver.disconnect();
        }
      };
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (sidebarObserver) {
        sidebarObserver.disconnect();
      }
    };
  }, [sidebarOpen]);

  return leftPosition;
}

