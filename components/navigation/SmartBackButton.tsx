'use client';

import { ArrowLeft } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getRouteFallback,
  isAuthPathname,
  getSafeInternalReturnTo,
  getSafePreviousRoute,
} from '@/lib/safe-navigation';

function subscribeToNavigationHistory(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('averon-navigation-history', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('averon-navigation-history', onChange);
  };
}

function getPreviousRouteSnapshot() {
  try {
    return sessionStorage.getItem('averon_prev_page');
  } catch {
    return null;
  }
}

const labels = {
  ru: { back: 'Назад', home: 'На главную', login: 'Ко входу', catalog: 'В каталог', cart: 'В корзину', orders: 'К заказам' },
  uz: { back: 'Orqaga', home: 'Bosh sahifaga', login: 'Kirishga', catalog: 'Katalogga', cart: 'Savatchaga', orders: 'Buyurtmalarga' },
  en: { back: 'Back', home: 'Home', login: 'Sign in', catalog: 'Back to catalog', cart: 'Back to cart', orders: 'Back to orders' },
} as const;

export function SmartBackButton({ fallbackHref }: { fallbackHref: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeFallback = getRouteFallback(pathname, locale);
  const fallback = isAuthPathname(pathname, locale)
    ? routeFallback
    : getSafeInternalReturnTo(fallbackHref, locale) ?? routeFallback;
  const storedPreviousRoute = useSyncExternalStore(
    subscribeToNavigationHistory,
    getPreviousRouteSnapshot,
    () => null,
  );
  const returnTo = getSafePreviousRoute(searchParams.get('returnTo'), pathname, locale);
  const previousRoute = getSafePreviousRoute(storedPreviousRoute, pathname, locale);

  const goBack = () => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }
    if (previousRoute) {
      router.replace(previousRoute);
      return;
    }
    router.replace(fallback);
  };

  const labelSet = labels[locale as keyof typeof labels] ?? labels.en;
  const fallbackPath = fallback.split(/[?#]/, 1)[0];
  const label = returnTo || previousRoute ? 'back'
    : fallbackPath === `/${locale}` ? 'home'
    : fallbackPath.endsWith('/login') ? 'login'
      : fallbackPath.endsWith('/cart') ? 'cart'
        : fallbackPath.endsWith('/orders') ? 'orders'
          : fallbackPath.endsWith('/catalog') ? 'catalog'
            : 'back';
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-stone-600 transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:text-stone-300 dark:hover:text-white"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {labelSet[label as keyof typeof labelSet] ?? labelSet.back}
    </button>
  );
}
