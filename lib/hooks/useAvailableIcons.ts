'use client';

import { useState, useEffect } from 'react';
import { detectAvailablePositiveIcons, generatePositiveIconPaths, generateNegativeIconPaths } from '../iconUtils';

/**
 * Hook to detect and cache available positive skill icons
 * Detects once on mount and caches the result
 */
export function useAvailablePositiveIcons() {
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const detectIcons = async () => {
      try {
        const count = await detectAvailablePositiveIcons(60);
        if (isMounted) {
          setAvailableIcons(generatePositiveIconPaths(count));
          setIsDetecting(false);
        }
      } catch (error) {
        console.error('Error detecting icons:', error);
        // Fallback to a reasonable default (e.g., 60 icons)
        if (isMounted) {
          setAvailableIcons(generatePositiveIconPaths(60));
          setIsDetecting(false);
        }
      }
    };

    detectIcons();

    return () => {
      isMounted = false;
    };
  }, []);

  return { availableIcons, isDetecting };
}

/**
 * Hook to get negative icon paths (static, no detection needed)
 */
export function useAvailableNegativeIcons() {
  return generateNegativeIconPaths(7);
}

