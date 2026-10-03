'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'framer-motion';

export function CatalogFilterLayout({
  filters,
  mobileFilters,
  resultCount,
  children,
}: {
  filters: React.ReactNode;
  mobileFilters: React.ReactNode;
  resultCount: number;
  children: React.ReactNode;
}) {
  const t = useTranslations('catalog');
  const router = useRouter();
  const [filtersVisible, setFiltersVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  const asideRef = useRef<HTMLElement>(null);
  const [asideReady, setAsideReady] = useState(false);

  // Mark as ready after first render so CSS transition fires correctly
  useEffect(() => {
    const id = requestAnimationFrame(() => setAsideReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let refreshTimer: number | undefined;
    const refreshCatalogOnHistoryNavigation = () => {
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => router.refresh(), 0);
    };
    window.addEventListener('popstate', refreshCatalogOnHistoryNavigation);
    return () => {
      window.removeEventListener('popstate', refreshCatalogOnHistoryNavigation);
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [router]);

  const toggle = (
    <button
      type="button"
      aria-expanded={filtersVisible}
      onClick={() => setFiltersVisible((visible) => !visible)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:border-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-primary-500 dark:hover:text-primary-300"
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      {filtersVisible ? t('hideFilters') : t('showFilters')}
    </button>
  );

  // Duration for the animation
  const duration = reduceMotion ? '0ms' : '220ms';
  const ease = 'cubic-bezier(0.25, 1, 0.5, 1)';

  return (
    <div data-catalog-filters-visible={filtersVisible}>
      {/* Header: "Товары (N)" left, toggle button right */}
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {t('products')} <span className="text-stone-400">({resultCount})</span>
        </h2>
        {toggle}
      </header>

      {/* Main body: sidebar + content, aligned at the same top edge */}
      <div className="flex flex-col items-start lg:flex-row">
        {/* Desktop sidebar */}
        <aside
          ref={asideRef}
          className="hidden lg:block shrink-0 overflow-hidden"
          style={
            asideReady
              ? {
                  width: filtersVisible ? 290 : 0,
                  marginRight: filtersVisible ? 24 : 0,
                  opacity: filtersVisible ? 1 : 0,
                  transition: reduceMotion
                    ? undefined
                    : `width ${duration} ${ease}, margin-right ${duration} ${ease}, opacity ${duration} ${ease}`,
                }
              : {
                  width: 290,
                  marginRight: 24,
                  opacity: 1,
                }
          }
          aria-hidden={!filtersVisible}
        >
          {/* Fixed-width inner prevents content from squishing during animation */}
          <div className="w-[290px]">{filters}</div>
        </aside>

        {/* Product area – always starts at the same top as filters */}
        <section className="min-w-0 flex-1 w-full">
          {/* Mobile filters: height-based collapse */}
          <div
            className="overflow-hidden lg:hidden"
            style={
              reduceMotion
                ? { display: filtersVisible ? undefined : 'none' }
                : {
                    maxHeight: filtersVisible ? '2000px' : '0',
                    opacity: filtersVisible ? 1 : 0,
                    transition: filtersVisible
                      ? `max-height 300ms ${ease}, opacity 200ms ${ease}`
                      : `max-height 220ms ${ease}, opacity 180ms ${ease}`,
                    overflow: 'hidden',
                  }
            }
            aria-hidden={!filtersVisible}
          >
            <div className="mb-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              {mobileFilters}
            </div>
          </div>

          {children}
        </section>
      </div>
    </div>
  );
}
