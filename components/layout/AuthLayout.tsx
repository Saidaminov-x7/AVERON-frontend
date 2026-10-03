"use client";

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { getAuthHomeHref } from '@/lib/safe-navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/95">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <SmartBackButton fallbackHref={getAuthHomeHref(locale)} />
            <Link href={getAuthHomeHref(locale)} aria-label="AVERON" className="text-sm font-black tracking-[.2em] text-stone-800 dark:text-stone-100">
              AVERON
            </Link>
          </div>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
