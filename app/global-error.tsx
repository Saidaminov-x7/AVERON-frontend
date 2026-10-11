'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { getSafeErrorReportPath, sanitizeErrorReportText } from '@/lib/safe-error-report';
import './[locale]/globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    try {
      const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (backendBaseUrl) {
        fetch(`${backendBaseUrl}/error-reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: sanitizeErrorReportText(error.message || 'Unknown global error'),
            stack: sanitizeErrorReportText(error.stack || ''),
            url: getSafeErrorReportPath(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            severity: 'error',
          }),
        }).catch(() => {});
      }
    } catch {
      // ignore reporting errors
    }
  }, [error]);

  useEffect(() => {
    const root = document.documentElement;
    const storageKey = 'ijara_theme_preference';
    let preference: string | null = null;
    try {
      preference = window.localStorage.getItem(storageKey);
    } catch {
      // System theme remains available when browser storage is disabled.
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = preference === 'dark' || (preference !== 'light' && media.matches);
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);
    };

    applyTheme();
    if (preference === 'dark' || preference === 'light') return;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, []);

  return (
    <html lang="ru">
      <body className="min-h-screen bg-[var(--color-bg)] p-4 text-[var(--color-text)]">
        <main className="grid min-h-[calc(100vh-2rem)] place-items-center">
          <section className="averon-panel grid w-full max-w-4xl overflow-hidden md:grid-cols-[.72fr_1fr]">
            <div className="flex min-h-64 flex-col justify-between bg-[var(--color-primary)] p-8 text-[var(--color-on-primary)] md:min-h-[420px] md:p-12">
              <span className="text-xs font-bold tracking-[.2em]">AVERON</span>
              <div>
                <p className="text-7xl font-semibold leading-none tracking-[-.08em] sm:text-8xl">500</p>
                <p className="mt-4 max-w-xs text-sm leading-6 opacity-80">Мы уже получили отчёт и работаем над исправлением.</p>
              </div>
            </div>
            <div className="flex flex-col justify-center bg-[var(--color-surface)] p-8 md:p-12">
              <div className="mb-7 flex h-12 w-12 items-center justify-center border border-[var(--color-border)] text-[var(--color-error)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="averon-kicker">Сервис временно недоступен</p>
              <h1 className="averon-title mt-3 text-3xl text-[var(--color-text)] sm:text-4xl">Что-то пошло не так</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
                Произошла непредвиденная ошибка. Попробуйте повторить действие или вернитесь на главную.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => reset()} className="averon-primary-button">
                  Попробовать снова
                </button>
                <Link href="/" className="averon-secondary-button">
                  На главную
                </Link>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
