'use client';

import { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CatalogFilterDrawerContext } from './catalog-filter-drawer-context';

export function CatalogFilterLayout({
  children,
  filters,
  mobileFilters,
  resultCount,
  closeLabel,
}: {
  children: React.ReactNode;
  filters: React.ReactNode;
  mobileFilters: React.ReactNode;
  resultCount: number;
  closeLabel: string;
}) {
  const t = useTranslations('catalog');
  const dialogId = useId();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('products')} <span className="font-normal text-[var(--color-muted)]">({resultCount})</span></h2>
        <Button
          type="button"
          variant="outline"
          className="hidden min-h-11 lg:inline-flex"
          data-catalog-filter-toggle="desktop"
          aria-expanded={desktopOpen}
          onClick={() => setDesktopOpen((open) => !open)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>{desktopOpen ? t('hideFilters') : t('filters')}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 lg:hidden"
          data-catalog-filter-toggle="mobile"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          aria-controls={dialogId}
          onClick={() => setMobileOpen(true)}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>{t('filters')}</span>
        </Button>
      </div>
      <div data-catalog-filters-visible={desktopOpen} className={desktopOpen ? 'grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]' : 'grid gap-6'}>
        {desktopOpen && <aside className="hidden lg:block">{filters}</aside>}
        <div className="min-w-0">{children}</div>
      </div>
      <Modal
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title={t('filters')}
        closeLabel={closeLabel}
        id={dialogId}
        maxWidth="max-w-2xl"
        fullscreenOnMobile
      >
        <CatalogFilterDrawerContext.Provider value={{ close: () => setMobileOpen(false), stickyActions: true }}>
          {mobileFilters}
        </CatalogFilterDrawerContext.Provider>
      </Modal>
    </>
  );
}
