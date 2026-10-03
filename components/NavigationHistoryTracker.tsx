'use client';

import { useLayoutEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getRouteAccess } from '@/lib/safe-navigation';

const PREV_PAGE_KEY = 'averon_prev_page';
const CURR_PAGE_KEY = 'averon_curr_page';
const LAST_PUBLIC_PAGE_KEY = 'averon_last_public_page';

const AUTH_REDIRECT_TARGET_KEY = 'averon_auth_redirect_target';

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    if (!pathname) return;

    try {
      const query = searchParams.toString();
      const currentRoute = `${pathname}${query ? `?${query}` : ''}`;
      const currentStored = sessionStorage.getItem(CURR_PAGE_KEY);
      const locale = pathname.split('/').filter(Boolean)[0] ?? 'ru';
      const routeAccess = getRouteAccess(pathname, locale);
      const redirectTarget = sessionStorage.getItem(AUTH_REDIRECT_TARGET_KEY);
      const isAuthRedirectLanding = routeAccess === 'auth' &&
        redirectTarget === currentStored?.split(/[?#]/, 1)[0];
      if (isAuthRedirectLanding) sessionStorage.removeItem(AUTH_REDIRECT_TARGET_KEY);
      if (currentStored && currentStored !== currentRoute && !isAuthRedirectLanding) {
        sessionStorage.setItem(PREV_PAGE_KEY, currentStored);
      }
      sessionStorage.setItem(CURR_PAGE_KEY, currentRoute);
      window.dispatchEvent(new Event('averon-navigation-history'));

      if (routeAccess === 'public') {
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
