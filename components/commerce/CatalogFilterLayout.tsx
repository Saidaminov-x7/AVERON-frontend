'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

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
    <Button
      type="button"
      variant="outline"
      aria-expanded={filtersVisible}
      onClick={() => setFiltersVisible((visible) => !visible)}
      className="min-h-10 shrink-0 px-3 text-sm"
    >
      <SlidersHorizontal size={16} aria-hidden="true" />
      {filtersVisible ? t('hideFilters') : t('showFilters')}
    </Button>
  );

  return (
    <div className="mt-6 lg:mt-0">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {t('products')} <span className="font-normal text-[var(--color-muted)]">({resultCount})</span>
        </h2>
        {toggle}
      </header>
      <div
        data-catalog-filters-visible={filtersVisible}
        className={`grid grid-cols-1 gap-8 ${filtersVisible ? 'lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]' : ''}`}
      >
        {filtersVisible ? (
          <aside
            className="hidden min-w-0 lg:block lg:self-stretch"
          >
            {filters}
          </aside>
        ) : null}
        <section className="min-w-0 lg:self-stretch">
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
