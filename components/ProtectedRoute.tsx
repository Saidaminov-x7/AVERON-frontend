// src/components/ProtectedRoute.tsx
// HOC для защиты маршрутов: проверяет авторизацию с сохранением locale и redirect URL

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getSafeInternalReturnTo } from '@/lib/safe-navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'ru';
  const search = searchParams.toString();
  const locationSuffix = `${search ? `?${search}` : ''}${typeof window === 'undefined' ? '' : window.location.hash}`;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = getSafeInternalReturnTo(`${pathname}${locationSuffix}`, locale) ?? `/${locale}/profile`;
      const redirectUrl = `/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, pathname, locale, locationSuffix]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-stone-500">
          <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
