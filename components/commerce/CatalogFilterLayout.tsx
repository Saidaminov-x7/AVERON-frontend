'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:border-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:text-stone-200"
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      {filtersVisible ? t('hideFilters') : t('showFilters')}
    </button>
  );

  return (
    <div className="mt-6 lg:mt-0">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {t('products')} <span className="text-stone-400">({resultCount})</span>
        </h2>
        {toggle}
      </header>
      <motion.div
        layout
        data-catalog-filters-visible={filtersVisible}
        className={`grid grid-cols-1 gap-6 transition-[grid-template-columns] ${reduceMotion ? 'duration-0' : 'duration-250'} ${filtersVisible ? 'lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)]' : ''}`}
        transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
      >
        <AnimatePresence initial={false}>
        {filtersVisible ? (
          <motion.aside
            className="hidden min-w-0 overflow-hidden lg:block"
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            {filters}
          </motion.aside>
        ) : null}
        </AnimatePresence>
        <section className="min-w-0">
        <AnimatePresence initial={false}>
        {filtersVisible ? (
            <motion.div
              className="mb-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 lg:hidden dark:border-white/10 dark:bg-stone-900"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
            >
              {mobileFilters}
            </motion.div>
          ) : null}
          </AnimatePresence>
          {children}
        </section>
      </motion.div>
    </div>
  );
}
