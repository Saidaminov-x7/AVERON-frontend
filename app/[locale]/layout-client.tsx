"use client";

import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppChrome } from '@/components/AppChrome';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { CookieConsent } from '@/components/providers/CookieConsent';
import { GlobalErrorListener } from '@/components/GlobalErrorListener';
import { NavigationHistoryTracker } from '@/components/NavigationHistoryTracker';
import AuthInitializer from '@/components/AuthInitializer';
import { SiteViewportSettings } from '@/components/SiteViewportSettings';
import { CookieConsent } from '@/components/privacy/CookieConsent';
import type { PublicSiteSettings } from '@/lib/siteSettings';
import React, { Suspense, useLayoutEffect } from 'react';

const DEFAULT_LOCALE = 'ru';

export default function LocaleLayout({
  children,
  params,
  messages,
  initialSiteSettings,
}: {
  children: React.ReactNode;
  params: { locale: string };
  messages: Record<string, string>;
  initialSiteSettings?: PublicSiteSettings;
}) {
  const { locale } = params;

  const validLocale = locale || DEFAULT_LOCALE;

  useLayoutEffect(() => {
    document.documentElement.lang = validLocale;
  }, [validLocale]);

  if (!messages) {
    console.error('Messages not provided');
    return null;
  }

  return (
      <ThemeProvider>
        <NextIntlClientProvider locale={validLocale} messages={messages} timeZone="Asia/Tashkent">
          <QueryProvider initialSiteSettings={initialSiteSettings}>
            <SiteViewportSettings />
            <Suspense fallback={null}>
              <NavigationHistoryTracker />
            </Suspense>
            <AuthInitializer />
            <GlobalErrorListener />
            <Suspense fallback={null}>
              <AnalyticsTracker />
            </Suspense>
            <div className="flex min-h-screen flex-col">
              <AppChrome>{children}</AppChrome>
            </div>
            <CookieConsent />
            <Toaster closeButton richColors position="top-center" visibleToasts={4} toastOptions={{ duration: 4000 }} />
            <CookieConsent />
          </QueryProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
  );
}
