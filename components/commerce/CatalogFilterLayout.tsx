'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const [filtersVisible, setFiltersVisible] = useState(true);
  const toggle = (
    <button
      type="button"
      aria-expanded={filtersVisible}
      onClick={() => setFiltersVisible((visible) => !visible)}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border border-[var(--color-border)] px-3 text-sm font-semibold text-stone-700 hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-stone-200"
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
      <div
        data-catalog-filters-visible={filtersVisible}
        className={`grid grid-cols-1 gap-6 ${filtersVisible ? 'lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)]' : ''}`}
      >
        {filtersVisible ? (
          <aside
            className="hidden min-w-0 overflow-hidden lg:block"
          >
            {filters}
          </aside>
        ) : null}
        <section className="min-w-0">
        {filtersVisible ? (
            <div
              className="mb-4 overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:hidden"
            >
              {mobileFilters}
            </div>
          ) : null}
          {children}
        </section>
      </div>
    </div>
  );
}
