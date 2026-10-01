'use client';

import Link from 'next/link';
import { Heart, Scale } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';
import { productTitle, type StoreProduct } from '@/lib/products';

export type { StoreProduct } from '@/lib/products';
export { productTitle } from '@/lib/products';

export function ProductCard({
  product,
  locale,
  catalogQuery = '',
}: {
  product: StoreProduct;
  locale: string;
  catalogQuery?: string;
}) {
  const title = productTitle(product, locale);
  const image = product.images?.[0]?.url;
  const price = Number(product.salePriceUzs || 0).toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU');
  const currency = locale === 'en' ? 'UZS' : locale === 'uz' ? "so'm" : 'сум';
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isCompared = useCompareStore((state) => state.isInCompare(product.id));
  const toggleCompare = useCompareStore((state) => state.toggle);

  return (
    <article className="group relative max-w-sm overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300 motion-safe:hover:shadow-lg dark:border-white/10 dark:bg-stone-900 dark:motion-safe:hover:border-white/20">
      <Link
        href={`/${locale}/catalog/${product.slug}${catalogQuery ? `?${catalogQuery}` : ''}`}
        className="block"
      >
        <div className="relative h-52 overflow-hidden bg-stone-100 sm:h-56 dark:bg-stone-800">
          <ProductImage src={image} alt={title} />
        </div>
        <div className="p-4">
          <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{title}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <strong>{price} {currency}</strong>
            {product.compareAtPriceUzs ? <span className="text-xs text-stone-400 line-through">{Number(product.compareAtPriceUzs).toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')} {currency}</span> : null}
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 flex gap-2">
        <button type="button" aria-label={isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению'} onClick={() => toggleCompare(product.id)} className={`flex size-10 items-center justify-center rounded-full border border-white/60 bg-white/90 backdrop-blur ${isCompared ? 'text-primary-700' : 'text-stone-700'}`}><Scale size={17} /></button>
        <button type="button" aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'} onClick={() => toggleFavorite(product.id)} className={`flex size-10 items-center justify-center rounded-full border border-white/60 bg-white/90 backdrop-blur ${isFavorite ? 'text-rose-600' : 'text-stone-700'}`}><Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      </div>
    </article>
  );
}
