'use client';

import { useState, useLayoutEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export type DashboardToolbarInset = {
  top: number;
  bottom: number;
};

const FALLBACK_BOTTOM = 80;

function measureInset(): DashboardToolbarInset {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: FALLBACK_BOTTOM };
  }

  const topNav = document.querySelector('[data-top-nav]') as HTMLElement | null;
  const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement | null;

  const top = topNav ? topNav.getBoundingClientRect().bottom : 0;
  let bottom = FALLBACK_BOTTOM;
  if (bottomNav) {
    bottom = Math.max(0, window.innerHeight - bottomNav.getBoundingClientRect().top);
  }

  return { top, bottom };
}

/**
 * Pixel insets from the viewport top and bottom so fixed UI (e.g. canvas toolbar)
 * sits between the dashboard top nav and fixed bottom bar.
 */
export function useDashboardToolbarInset(): DashboardToolbarInset {
  const [inset, setInset] = useState<DashboardToolbarInset>({ top: 0, bottom: FALLBACK_BOTTOM });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? '';

  const update = useCallback(() => {
    const nextInset = measureInset();
    setInset(nextInset);
  }, []);

  useLayoutEffect(() => {
    update();

    const rafId = requestAnimationFrame(() => {
      update();
    });

    window.addEventListener('resize', update);
    const topNav = document.querySelector('[data-top-nav]');
    const bottomNav = document.querySelector('[data-bottom-nav]');

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) {
      if (topNav) ro.observe(topNav);
      if (bottomNav) ro.observe(bottomNav);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
  }, [update, pathname, searchKey]);

  return inset;
}
