'use client';

import { useId, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CatalogSelect } from './CatalogSelect';
import type { CatalogFacets } from '@/lib/storefront-catalog';
import { categoryName, type StoreCategory } from '@/lib/products';

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
const controlClass = 'h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-primary-400';

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

  const set = (key: keyof FilterValues, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams();
    keys.forEach((key) => {
      const value = draft[key].trim();
      if (key === 'minPrice' || key === 'maxPrice') {
        if (!value || !/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value))) return;
      } else if (!value) return;
      query.set(key, value);
    });
    const suffix = query.toString();
    router.push(`${pathname}${suffix ? `?${suffix}` : ''}`);
  };

  const reset = () => {
    setDraft({ q: '', category: '', audience: '', country: '', size: '', color: '', minPrice: '', maxPrice: '', sort: 'newest' });
    onReset?.();
    router.push(`/${locale}/catalog`);
  };
  const active = keys.some((key) => key === 'sort'
    ? draft.sort !== 'newest'
    : Boolean(draft[key].trim()));
  const categoriesOptions = [
    { value: '', label: t('all') },
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
    <form onSubmit={apply}>
      <label className="text-xs font-bold uppercase text-stone-500" htmlFor={`${id}-search`}>{t('search')}</label>
      <input id={`${id}-search`} className={`${controlClass} mt-2`} value={draft.q} onChange={(event) => set('q', event.target.value)} placeholder={t('placeholder')} />
      <div className="mt-5">
        <CatalogSelect name="category" label={t('category')} value={draft.category} placeholder={t('all')} options={categoriesOptions} onValueChange={(value) => set('category', value)} />
        {categoriesError && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">{locale === 'uz' ? 'Toifalarni yuklab bo‘lmadi.' : locale === 'en' ? 'Categories could not be loaded.' : 'Не удалось загрузить категории.'}</p>}
      </div>
      <fieldset className="mt-5">
        <legend className="text-xs font-bold uppercase text-stone-500">{t('audience')}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {audiences.map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              aria-pressed={draft.audience === value}
              onClick={() => set('audience', value)}
              className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                draft.audience === value
                  ? 'border-primary-600 bg-primary-600 text-white shadow-sm dark:border-primary-500 dark:bg-primary-600 dark:text-white'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-primary-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-primary-500'
              }`}
            >
              {label}
            </button>
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
      <p className="mt-5 text-xs font-bold uppercase text-stone-500">{t('price')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {(['minPrice', 'maxPrice'] as const).map((key) => <input key={key} className={controlClass} aria-label={key === 'minPrice' ? t('from') : t('to')} type="text" inputMode="decimal" value={draft[key]} onChange={(event) => set(key, event.target.value)} placeholder={key === 'minPrice' ? t('from') : t('to')} />)}
      </div>
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
      <button type="submit" className="mt-5 h-11 w-full rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">{t('show')}</button>
      <button type="button" disabled={!active} onClick={reset} className="mt-2 h-10 w-full rounded-xl text-sm font-semibold text-stone-600 enabled:hover:bg-stone-100 disabled:opacity-40 dark:text-stone-300 dark:enabled:hover:bg-stone-800">{t('reset')}</button>
    </form>
  );
}
