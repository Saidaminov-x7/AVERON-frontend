"use client";

import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppChrome } from '@/components/AppChrome';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
import { YandexMetrika } from '@/components/analytics/YandexMetrika';
import { GlobalErrorListener } from '@/components/GlobalErrorListener';
import { NavigationHistoryTracker } from '@/components/NavigationHistoryTracker';
import AuthInitializer from '@/components/AuthInitializer';
import { SiteViewportSettings } from '@/components/SiteViewportSettings';
import type { PublicSiteSettings } from '@/lib/siteSettings';
import './globals.css';
import React, { Suspense } from 'react';

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

  if (!messages) {
    console.error('Messages not provided');
    return null;
  }
  const validLocale = locale || DEFAULT_LOCALE;

  return (
      <ThemeProvider>
        <NextIntlClientProvider locale={validLocale} messages={messages} timeZone="Asia/Tashkent">
          <QueryProvider initialSiteSettings={initialSiteSettings}>
            <SiteViewportSettings />
            <NavigationHistoryTracker />
            <AuthInitializer />
            <GlobalErrorListener />
            <AnalyticsTracker />
            <Suspense fallback={null}>
              <YandexMetrika counterId="112059980" />
            </Suspense>
            <div className="flex min-h-screen flex-col">
              <AppChrome>{children}</AppChrome>
            </div>
            <Toaster richColors position="top-center" />
          </QueryProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
  );
}
