"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface YandexMetrikaProps {
  counterId?: string;
}

declare global {
  interface Window {
    ym?: (
      counterId: number,
      action: 'hit',
      url: string,
      options: { title: string; referrer: string },
    ) => void;
  }
}

/**
 * Отслеживание переходов по страницам для Яндекс.Метрики в Next.js App Router
 */
export function YandexMetrika({ counterId = "112059980" }: YandexMetrikaProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ym) {
      const url = window.location.href;
      window.ym(Number(counterId), 'hit', url, {
        title: document.title,
        referrer: document.referrer,
      });
    }
  }, [pathname, searchParams, counterId]);

  return null;
}
