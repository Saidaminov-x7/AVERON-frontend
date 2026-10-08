'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CatalogSelect } from './CatalogSelect';
import type { CatalogFacets } from '@/lib/storefront-catalog';
import { categoryName, type StoreCategory } from '@/lib/products';
import { Button } from '@/components/ui/Button';

type FilterValues = {
  q: string;
  category: string;
  audience: string;
  country: string;
  size: string;
  color: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

const keys = ['q', 'category', 'audience', 'country', 'size', 'color', 'minPrice', 'maxPrice', 'sort'] as const;
const controlClass = 'h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-primary-600/15';

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
    startTransition(() => router.push(`${pathname}${suffix ? `?${suffix}` : ''}`));
  };

  const reset = () => {
    setDraft({ q: '', category: '', audience: '', country: '', size: '', color: '', minPrice: '', maxPrice: '', sort: 'newest' });
    setFilterError('');
    onReset?.();
    startTransition(() => router.push(`/${locale}/catalog`));
  };
  const active = keys.some((key) => key === 'sort'
    ? draft.sort !== 'newest'
    : Boolean(draft[key].trim()));
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
    <form onSubmit={apply} aria-busy={isPending} className="flex h-full flex-col">
      <label className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--color-muted)]" htmlFor={`${id}-search`}>{t('search')}</label>
      <input id={`${id}-search`} className={`${controlClass} mt-2`} value={draft.q} onChange={(event) => set('q', event.target.value)} placeholder={t('placeholder')} />
      <div className="mt-5">
        <CatalogSelect name="category" label={t('category')} value={draft.category} placeholder={t('all')} options={categoriesOptions} onValueChange={(value) => set('category', value)} />
        {categoriesError && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">{locale === 'uz' ? 'Toifalarni yuklab bo‘lmadi.' : locale === 'en' ? 'Categories could not be loaded.' : 'Не удалось загрузить категории.'}</p>}
      </div>
      <fieldset className="mt-5">
        <legend className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--color-muted)]">{t('audience')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {audiences.map(([value, label]) => (
            <Button key={value || 'all'} variant={draft.audience === value ? 'default' : 'outline'} type="button" aria-pressed={draft.audience === value} onClick={() => set('audience', value)} className="min-h-11 px-3 text-sm">{label}</Button>
          ))}
        </div>
      </fieldset>
      <div className="mt-5">
        <CatalogSelect name="country" label={t('country')} value={draft.country} placeholder={t('allCountries')} options={countries.map(([value, label]) => ({ value, label }))} onValueChange={(value) => set('country', value)} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <CatalogSelect name="size" label={t('size')} value={draft.size} placeholder={t('anySize')} options={[{ value: '', label: t('anySize') }, ...sizes.map((value) => ({ value, label: value }))]} onValueChange={(value) => set('size', value)} />
        <CatalogSelect name="color" label={t('color')} value={draft.color} placeholder={t('anyColor')} options={[{ value: '', label: t('anyColor') }, ...colors.map((value) => ({ value, label: value }))]} onValueChange={(value) => set('color', value)} />
      </div>
      {facetsError && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">{locale === 'uz' ? 'O‘lcham va ranglar ro‘yxatini yuklab bo‘lmadi.' : locale === 'en' ? 'Available sizes and colors could not be loaded.' : 'Не удалось загрузить доступные размеры и цвета.'}</p>}
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--color-muted)]">{t('price')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(['minPrice', 'maxPrice'] as const).map((key) => <input key={key} className={controlClass} aria-label={key === 'minPrice' ? t('from') : t('to')} type="text" inputMode="decimal" value={draft[key]} onChange={(event) => set(key, event.target.value)} placeholder={key === 'minPrice' ? t('from') : t('to')} />)}
      </div>
      {filterError && <p className="mt-2 text-xs text-red-700 dark:text-red-300" role="alert">{filterError}</p>}
      <div className="mt-5">
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
      <Button type="submit" loading={isPending} loadingLabel={t('applying')} className="mt-5 w-full" aria-live="polite">{t('show')}</Button>
      <Button type="button" variant="outline" disabled={!active || isPending} onClick={reset} className="mt-2 w-full">{t('reset')}</Button>
      <div className="hidden flex-1 lg:block" aria-hidden="true" />
    </form>
  );
}
