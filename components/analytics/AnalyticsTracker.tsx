"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackCommerceEvent, type CommerceEventMetadata } from '@/lib/commerceAnalytics';
import { externalBaseURL } from '@/lib/axios';
import { COOKIE_CONSENT_EVENT, readCookieConsent } from '@/lib/cookieConsent';

function sendVisit(pathname: string) {
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
}

function isTrackablePath(pathname: string) {
  const privateRoute = /^\/(?:ru|uz|en)\/(?:login|register|forgot-password|reset-password|profile|cart|checkout|orders(?:\/|$)|favorites|compare|outfits|wishlist\/shared(?:\/|$)|mini-app)(?:\/|$)/;
  return /^\/(?:ru|uz|en)(?:\/|$)/.test(pathname) && !privateRoute.test(pathname) && !pathname.startsWith('/admin/') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/');
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousCatalogQuery = useRef<string | null>(null);
  const queryString = searchParams.toString();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isTrackablePath(pathname) || !readCookieConsent()?.analytics) return;

    trackCommerceEvent({ eventName: 'page_view' });
    if (/^\/(?:ru|uz|en)\/catalog\/?$/.test(pathname)) {
      const current = new URLSearchParams(queryString);
      const previous = previousCatalogQuery.current === null
        ? null
        : new URLSearchParams(previousCatalogQuery.current);
      const previousSearch = previous?.get('q') ?? '';
      const currentSearch = current.get('q') ?? '';
      const metadata: CommerceEventMetadata = {};
      const country = current.get('country');
      if (country === 'CN' || country === 'US' || country === 'TR' || country === 'IT' || country === 'GB') metadata.country = country;
      const audience = current.get('audience');
      if (audience === 'all' || audience === 'women' || audience === 'men' || audience === 'kids') metadata.audience = audience;
      const sort = current.get('sort');
      if (sort === 'popular' || sort === 'newest' || sort === 'price_asc' || sort === 'price_desc') metadata.sort = sort;
      const category = current.get('category');
      if (category) metadata.categorySlug = category.slice(0, 100);
      const size = current.get('size');
      if (size) metadata.size = size.slice(0, 40);
      const color = current.get('color');
      if (color) metadata.color = color.slice(0, 40);
      const minPriceValue = current.get('minPrice')?.trim();
      if (minPriceValue && /^\d+$/.test(minPriceValue)) {
        const minPrice = Number(minPriceValue);
        if (Number.isSafeInteger(minPrice) && minPrice >= 0) metadata.minPrice = minPrice;
      }
      const maxPriceValue = current.get('maxPrice')?.trim();
      if (maxPriceValue && /^\d+$/.test(maxPriceValue)) {
        const maxPrice = Number(maxPriceValue);
        if (Number.isSafeInteger(maxPrice) && maxPrice >= 0) metadata.maxPrice = maxPrice;
      }
      if (!previous || previousSearch !== currentSearch) {
        if (currentSearch || previousSearch) {
          trackCommerceEvent({ eventName: 'catalog_search', metadata: { ...metadata, queryLength: currentSearch.length } });
        }
      } else if (previous.toString() !== current.toString()) {
        trackCommerceEvent({ eventName: 'catalog_filter', metadata });
      }
      previousCatalogQuery.current = queryString;
    } else {
      previousCatalogQuery.current = null;
    }

    sendVisit(pathname);
  }, [pathname, queryString]);

  useEffect(() => {
    const onConsentChange = () => {
      if (readCookieConsent()?.analytics && isTrackablePath(pathname)) {
        trackCommerceEvent({ eventName: 'page_view' });
        sendVisit(pathname);
      }
    };
    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentChange);
  }, [pathname]);

  return null;
}
