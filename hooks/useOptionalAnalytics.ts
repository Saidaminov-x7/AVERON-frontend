'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { externalBaseURL } from '@/lib/axios';
import { canSendAnalytics } from '@/lib/analyticsPolicy';
import { subscribeToConsentChanges, clearAnalyticsIdentifier } from '@/lib/consent';
import { trackCommerceEvent, type CommerceEventMetadata } from '@/lib/commerceAnalytics';

export function useOptionalAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousCatalogQuery = useRef<string | null>(null);
  const [consentRevision, setConsentRevision] = useState(0);

  useEffect(() => {
    if (!canSendAnalytics()) {
      previousCatalogQuery.current = null;
      return;
    }
    const privateRoute = /^\/(?:ru|uz|en)\/(?:login|register|forgot-password|reset-password|profile|cart|checkout|orders(?:\/|$)|favorites|compare|outfits|wishlist\/shared(?:\/|$)|mini-app)(?:\/|$)/;
    if (!/^\/(?:ru|uz|en)(?:\/|$)/.test(pathname) || privateRoute.test(pathname)
      || pathname.startsWith('/admin/') || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return;

    trackCommerceEvent({ eventName: 'page_view' });
    if (/^\/(?:ru|uz|en)\/catalog\/?$/.test(pathname)) {
      const current = new URLSearchParams(searchParams.toString());
      const previous = previousCatalogQuery.current === null ? null : new URLSearchParams(previousCatalogQuery.current);
      const previousSearch = previous?.get('q') ?? '';
      const currentSearch = current.get('q') ?? '';
      const metadata: CommerceEventMetadata = {};
      const country = current.get('country');
      if (country && ['CN', 'US', 'TR', 'IT', 'GB'].includes(country)) metadata.country = country as CommerceEventMetadata['country'];
      const audience = current.get('audience');
      if (audience && ['all', 'women', 'men', 'kids'].includes(audience)) metadata.audience = audience as CommerceEventMetadata['audience'];
      const sort = current.get('sort');
      if (sort && ['popular', 'newest', 'price_asc', 'price_desc'].includes(sort)) metadata.sort = sort as CommerceEventMetadata['sort'];
      const category = current.get('category');
      if (category) metadata.categorySlug = category.slice(0, 100);
      const size = current.get('size');
      if (size) metadata.size = size.slice(0, 40);
      const color = current.get('color');
      if (color) metadata.color = color.slice(0, 40);
      for (const key of ['minPrice', 'maxPrice'] as const) {
        const value = current.get(key)?.trim();
        if (value && /^\d+$/.test(value)) {
          const numericValue = Number(value);
          if (Number.isSafeInteger(numericValue) && numericValue >= 0) metadata[key] = numericValue;
        }
      }
      if (!previous || previousSearch !== currentSearch) {
        if (currentSearch || previousSearch) trackCommerceEvent({ eventName: 'catalog_search', metadata: { ...metadata, queryLength: currentSearch.length } });
      } else if (previous.toString() !== current.toString()) {
        trackCommerceEvent({ eventName: 'catalog_filter', metadata });
      }
      previousCatalogQuery.current = searchParams.toString();
    } else {
      previousCatalogQuery.current = null;
    }
  }, [pathname, searchParams, consentRevision]);

  useEffect(() => {
    if (!canSendAnalytics()) {
      clearAnalyticsIdentifier();
      return;
    }
    try {
      let deviceId = localStorage.getItem('averon_device_id');
      if (!deviceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId)) {
        deviceId = window.crypto.randomUUID();
        localStorage.setItem('averon_device_id', deviceId);
      }
      void fetch(`${externalBaseURL}/analytics/visit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, path: pathname }), keepalive: true,
      }).catch(() => {});
    } catch { /* Analytics is optional and must not block page rendering. */ }
  }, [pathname, consentRevision]);

  useEffect(() => subscribeToConsentChanges(() => {
    if (!canSendAnalytics()) {
      clearAnalyticsIdentifier();
      previousCatalogQuery.current = null;
    }
    setConsentRevision((revision) => revision + 1);
  }), []);
}
