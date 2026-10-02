"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { externalBaseURL } from '@/lib/axios';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const privateRoute = /^\/(?:ru|uz|en)\/(?:login|register|forgot-password|reset-password|profile|cart|checkout|orders(?:\/|$)|favorites|compare|outfits|wishlist\/shared(?:\/|$)|mini-app)(?:\/|$)/;
    if (
      !/^\/(?:ru|uz|en)(?:\/|$)/.test(pathname) ||
      privateRoute.test(pathname) ||
      pathname.startsWith('/admin/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/')
    ) return;

    try {
      let deviceId = localStorage.getItem('averon_device_id');
      if (!deviceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId)) {
        deviceId = window.crypto.randomUUID();
        localStorage.setItem('averon_device_id', deviceId);
      }

      void fetch(`${externalBaseURL}/analytics/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, path: pathname }),
        keepalive: true,
      }).catch(() => {});
    } catch { /* Analytics is optional and must never block page rendering. */ }
  }, [pathname]);

  return null;
}
