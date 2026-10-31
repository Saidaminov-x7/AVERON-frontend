"use client";

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { getAuthHomeHref } from '@/lib/safe-navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-surface-soft dark:bg-surface-soft">
      <header className="sticky top-0 z-50 w-full border-b border-line bg-white/95 backdrop-blur-sm dark:border-line dark:bg-surface-soft">
        <div className="container mx-auto px-4">
          <div className="flex h-24 items-center justify-between">
            <Link href={getAuthHomeHref(locale)} className="flex items-center gap-2 text-muted hover:text-ink dark:text-ink-soft dark:hover:text-white">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">{locale === 'uz' ? 'Bosh sahifaga' : locale === 'en' ? 'Go to home' : 'На главную'}</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex min-h-[calc(100vh-96px)] items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
