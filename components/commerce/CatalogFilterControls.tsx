'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CatalogSelect } from './CatalogSelect';
import type { CatalogFacets } from '@/lib/storefront-catalog';
import { categoryName, type StoreCategory } from '@/lib/products';
import { Button } from '@/components/ui/Button';
import { useCatalogFilterDrawer } from './catalog-filter-drawer-context';

type FilterValues = {
  q: string;
  category: string;
  audience: string;
  country: string;
  size: string;
  color: string;
  minPrice: string;
  maxPrice: string;
  saleOnly: string;
  sort: string;
};

const keys = ['q', 'category', 'audience', 'country', 'size', 'color', 'minPrice', 'maxPrice', 'saleOnly', 'sort'] as const;
const controlClass = 'catalog-filter-control h-11 w-full px-0 text-sm outline-none transition-colors placeholder:text-[var(--color-muted)]';

function valuesFromSearch(search: URLSearchParams): FilterValues {
  return Object.fromEntries(keys.map((key) => [key, search.get(key) ?? (key === 'sort' ? 'newest' : '')])) as FilterValues;
}

export function CatalogFilterControls({
  ...props
}: {
  locale: string;
  categories: StoreCategory[];
  categoriesError: boolean;
  facets: CatalogFacets;
  facetsError: boolean;
  onReset?: () => void;
}) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const initialValues = valuesFromSearch(new URLSearchParams(search));
  return <CatalogFilterDraft key={search} {...props} initialValues={initialValues} />;
}

function CatalogFilterDraft({
  locale,
  initialValues,
  categories,
  categoriesError,
  facets,
  facetsError,
  onReset,
}: {
  locale: string;
  initialValues: FilterValues;
  categories: StoreCategory[];
  categoriesError: boolean;
  facets: CatalogFacets;
  facetsError: boolean;
  onReset?: () => void;
}) {
  const t = useTranslations('catalog');
  const drawer = useCatalogFilterDrawer();
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState<FilterValues>(initialValues);
  const [isPending, startTransition] = useTransition();
  const [filterError, setFilterError] = useState('');

  const set = (key: keyof FilterValues, value: string) => {
    setFilterError('');
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minPrice = draft.minPrice.trim();
    const maxPrice = draft.maxPrice.trim();
    const isValidPrice = (value: string) => !value || (/^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(Number(value)));
    if (!isValidPrice(minPrice) || !isValidPrice(maxPrice)) {
      setFilterError(t('invalidPrice'));
      return;
    }
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setFilterError(t('priceRangeError'));
      return;
    }
    setFilterError('');
    const query = new URLSearchParams();
    keys.forEach((key) => {
      const value = draft[key].trim();
      if (!value) return;
      query.set(key, value);
    });
    const suffix = query.toString();
    drawer?.close();
    startTransition(() => router.push(`${pathname}${suffix ? `?${suffix}` : ''}`));
  };

  const reset = () => {
    setDraft({ q: '', category: '', audience: '', country: '', size: '', color: '', minPrice: '', maxPrice: '', saleOnly: '', sort: 'newest' });
    setFilterError('');
    onReset?.();
    drawer?.close();
    startTransition(() => router.push(`/${locale}/catalog`));
  };
  const active = keys.some((key) => key === 'sort'
    ? draft.sort !== 'newest'
    : Boolean((draft[key] ?? '').trim()));
  const categoriesOptions = [
    { value: '', label: t('all') },
    ...(draft.category && !categories.some((category) => category.slug === draft.category)
      ? [{ value: draft.category, label: draft.category.replaceAll('-', ' ') }]
      : []),
    ...categories.map((category) => ({
      value: category.slug,
      label: categoryName(category, locale),
    })),
  ];
  const audiences = [
    ['', t('everyone')],
    ['women', t('women')],
    ['men', t('men')],
    ['kids', t('kids')],
  ];
  const countries = [
    ['', t('allCountries')], ['CN', t('china')], ['US', t('unitedStates')],
    ['TR', t('turkey')], ['IT', t('italy')], ['GB', t('unitedKingdom')],
  ];
  const sizes = [...new Set([...(draft.size ? [draft.size] : []), ...facets.sizes])];
  const colors = [...new Set([...(draft.color ? [draft.color] : []), ...facets.colors])];

  return (
    <form onSubmit={apply} aria-busy={isPending} className="catalog-filter-rail catalog-filter-form flex h-full flex-col">
      <div className="catalog-filter-group">
        <label className="catalog-filter-label" htmlFor={`${id}-search`}>{t('search')}</label>
        <input id={`${id}-search`} className={`${controlClass} mt-2`} value={draft.q} onChange={(event) => set('q', event.target.value)} placeholder={t('placeholder')} />
      </div>
      <div className="catalog-filter-group">
        <CatalogSelect name="category" label={t('category')} value={draft.category} placeholder={t('all')} options={categoriesOptions} onValueChange={(value) => set('category', value)} />
        {categoriesError && <p className="catalog-filter-message mt-2 text-xs" role="status">{locale === 'uz' ? 'Toifalarni yuklab bo‘lmadi.' : locale === 'en' ? 'Categories could not be loaded.' : 'Не удалось загрузить категории.'}</p>}
      </div>
      <fieldset className="catalog-filter-group">
        <legend className="catalog-filter-label">{t('audience')}</legend>
        <div className="catalog-filter-audience mt-2 grid grid-cols-2">
          {audiences.map(([value, label]) => (
            <button key={value || 'all'} className={`catalog-filter-audience-option${draft.audience === value ? ' is-selected' : ''}`} type="button" aria-pressed={draft.audience === value} onClick={() => set('audience', value)}>{label}</button>
          ))}
        </div>
      </fieldset>
      <div className="catalog-filter-group">
        <CatalogSelect name="country" label={t('country')} value={draft.country} placeholder={t('allCountries')} options={countries.map(([value, label]) => ({ value, label }))} onValueChange={(value) => set('country', value)} />
      </div>
      <div className="catalog-filter-group catalog-filter-duo grid grid-cols-2">
        <CatalogSelect name="size" label={t('size')} value={draft.size} placeholder={t('anySize')} options={[{ value: '', label: t('anySize') }, ...sizes.map((value) => ({ value, label: value }))]} onValueChange={(value) => set('size', value)} />
        <CatalogSelect name="color" label={t('color')} value={draft.color} placeholder={t('anyColor')} options={[{ value: '', label: t('anyColor') }, ...colors.map((value) => ({ value, label: value }))]} onValueChange={(value) => set('color', value)} />
      </div>
      <label className="catalog-filter-sale flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[var(--color-text)]">
        <input
          type="checkbox"
          checked={draft.saleOnly === 'true'}
          onChange={(event) => set('saleOnly', event.target.checked ? 'true' : '')}
          className="size-4 accent-[var(--color-primary)]"
        />
        <span>{t('saleOnly')}</span>
      </label>
      {facetsError && <p className="catalog-filter-message catalog-filter-group text-xs" role="status">{locale === 'uz' ? 'O‘lcham va ranglar ro‘yxatini yuklab bo‘lmadi.' : locale === 'en' ? 'Available sizes and colors could not be loaded.' : 'Не удалось загрузить доступные размеры и цвета.'}</p>}
      <div className="catalog-filter-group">
        <p className="catalog-filter-label">{t('price')}</p>
        <div className="catalog-filter-price mt-2 grid grid-cols-2">
        {(['minPrice', 'maxPrice'] as const).map((key) => <input key={key} className={controlClass} aria-label={key === 'minPrice' ? t('from') : t('to')} type="text" inputMode="decimal" value={draft[key]} onChange={(event) => set(key, event.target.value)} placeholder={key === 'minPrice' ? t('from') : t('to')} />)}
        </div>
      </div>
      {filterError && <p className="catalog-filter-message catalog-filter-group text-xs" role="alert">{filterError}</p>}
      <div className="catalog-filter-group">
        <CatalogSelect
          name="sort"
          label={t('sort')}
          value={draft.sort}
          placeholder={t('newest')}
          options={[
            { value: 'newest', label: t('newest') },
            { value: 'price_asc', label: t('cheap') },
            { value: 'price_desc', label: t('expensive') },
            { value: 'popular', label: t('popular') },
          ]}
          onValueChange={(value) => set('sort', value)}
        />
      </div>
      <div className={drawer?.stickyActions ? 'catalog-filter-actions sticky bottom-0 z-10 -mx-4 mt-1 flex gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0' : 'catalog-filter-actions mt-1'}>
        <Button type="submit" loading={isPending} loadingLabel={t('applying')} className="catalog-filter-submit w-full" aria-live="polite">{t('show')}</Button>
        <Button type="button" variant="outline" disabled={!active || isPending} onClick={reset} className="catalog-filter-reset w-full">{t('reset')}</Button>
      </div>
    </form>
  );
}
