'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

const catalogCountries = new Set(['CN', 'US', 'TR', 'IT', 'GB']);
const GUEST_COUNTRY_KEY = 'averon_catalog_country';

export function CatalogCountryDefaultResolver({
  locale,
  hasExplicitCountry,
}: {
  locale: string;
  hasExplicitCountry: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (hasExplicitCountry || authLoading) return;

    const savedCountry = user?.defaultCatalogCountry ?? (() => {
      try {
        return localStorage.getItem(GUEST_COUNTRY_KEY);
      } catch {
        return null;
      }
    })();
    if (!savedCountry || !catalogCountries.has(savedCountry)) return;

    const params = new URLSearchParams(window.location.search);
    if (params.has('country')) return;
    params.set('country', savedCountry);
    router.replace(`/${locale}/catalog?${params.toString()}`, { scroll: false });
  }, [authLoading, hasExplicitCountry, locale, router, user]);

  return null;
}
