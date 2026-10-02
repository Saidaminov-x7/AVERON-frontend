'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CatalogFilterLayout({
  filters,
  children,
}: {
  filters: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations('catalog');
  const [filtersVisible, setFiltersVisible] = useState(true);

  return (
    <div
      className={`mt-6 grid gap-6 lg:mt-0 ${
        filtersVisible ? 'lg:grid-cols-[minmax(0,290px)_minmax(0,1fr)]' : 'lg:grid-cols-1'
      }`}
    >
      {filtersVisible ? <aside className="hidden lg:block">{filters}</aside> : null}
      <section className="min-w-0">
        <button
          type="button"
          aria-expanded={filtersVisible}
          onClick={() => setFiltersVisible((visible) => !visible)}
          className="mb-4 hidden min-h-10 items-center gap-2 rounded-xl border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:border-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/15 dark:text-stone-200 lg:inline-flex"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {filtersVisible ? t('hideFilters') : t('showFilters')}
        </button>
        {children}
      </section>
    </div>
  );
}
