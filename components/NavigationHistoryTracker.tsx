'use client';

import { useLayoutEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const PREV_PAGE_KEY = 'averon_prev_page';
const CURR_PAGE_KEY = 'ijara_curr_page';
const LAST_PUBLIC_PAGE_KEY = 'averon_last_public_page';

const AUTH_AND_PROTECTED_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/profile',
];

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    if (!pathname) return;

    try {
      const query = searchParams.toString();
      const currentRoute = `${pathname}${query ? `?${query}` : ''}`;
      const currentStored = sessionStorage.getItem(CURR_PAGE_KEY);
      if (currentStored && currentStored !== currentRoute) {
        sessionStorage.setItem(PREV_PAGE_KEY, currentStored);
      }
      sessionStorage.setItem(CURR_PAGE_KEY, currentRoute);
      window.dispatchEvent(new Event('averon-navigation-history'));

      const isProtectedOrAuth = AUTH_AND_PROTECTED_ROUTES.some((route) =>
        pathname.includes(route)
      );

      if (!isProtectedOrAuth) {
        sessionStorage.setItem(LAST_PUBLIC_PAGE_KEY, pathname);
      }
    } catch {
      // sessionStorage might not be accessible
    }
  }, [pathname, searchParams]);

  return null;
}

export function getPreviousPage(): string | null {
  try {
    return sessionStorage.getItem(PREV_PAGE_KEY);
  } catch {
    return null;
  }
}
