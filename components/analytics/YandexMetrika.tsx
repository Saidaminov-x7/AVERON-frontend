"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface YandexMetrikaProps {
  counterId: string;
}

declare global {
  interface Window {
    ym?: {
      (counterId: number, action: 'init', options: { ssr: false; accurateTrackBounce: true; trackLinks: true }): void;
      (counterId: number, action: 'hit', url: string, options: { title: string; referrer: string }): void;
    };
    averonYandexInitialized?: boolean;
    averonYandexReady?: boolean;
  }
}

export function YandexMetrika({ counterId }: YandexMetrikaProps) {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const updateReady = () => setReady(window.averonYandexReady === true && Boolean(window.ym));
    updateReady();
    window.addEventListener('averon-yandex-ready', updateReady);
    return () => window.removeEventListener('averon-yandex-ready', updateReady);
  }, []);

  useEffect(() => {
    const privateRoute = /^\/(?:ru|uz|en)\/(?:login|register|forgot-password|reset-password|profile|cart|checkout|orders(?:\/|$)|favorites|compare|outfits|wishlist\/shared(?:\/|$)|mini-app)(?:\/|$)/;
    const previous = previousPath.current;
    const isPublicRoute = Boolean(
      pathname &&
      /^\/(?:ru|uz|en)(?:\/|$)/.test(pathname) &&
      !privateRoute.test(pathname) &&
      !pathname.startsWith('/admin/') &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/'),
    );
    if (!isPublicRoute) {
      previousPath.current = null;
      return;
    }
    if (!ready || !window.averonYandexReady || !window.ym) return;

    try {
      if (!window.averonYandexInitialized) {
        window.ym(Number(counterId), 'init', {
          ssr: false,
          accurateTrackBounce: true,
          trackLinks: true,
        });
        window.averonYandexInitialized = true;
      } else if (previous !== pathname) {
        window.ym(Number(counterId), 'hit', `${window.location.origin}${pathname}`, {
          title: document.title,
          referrer: previous ? `${window.location.origin}${previous}` : '',
        });
      }
      previousPath.current = pathname;
    } catch {
      // Analytics failures must not interrupt navigation or rendering.
    }
  }, [pathname, counterId, ready]);

  return null;
}
