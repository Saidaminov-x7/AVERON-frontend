'use client';

import Link from 'next/link';
import { Heart, Scale } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';
import { productTitle, type StoreProduct } from '@/lib/products';
import { addWishlistItem, removeWishlistItem } from '@/lib/commerce-orders';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';
import { useAuthStore } from '@/store/useAuthStore';
import { useRef, useState } from 'react';

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
  const preorderOnly = product.recommendationAvailability
    ? product.recommendationAvailability.preorder
    : Boolean(product.availability?.preorderEligible && !product.availability.inStock);
  const unavailable = product.recommendationAvailability
    ? !product.recommendationAvailability.available
    : Boolean(product.availability && !product.availability.inStock && !product.availability.preorderEligible);
  const localizedAvailability = {
    en: { preorder: 'Preorder', unavailable: 'Out of stock' },
    uz: { preorder: 'Oldindan buyurtma', unavailable: 'Mavjud emas' },
    ru: { preorder: 'Предзаказ', unavailable: 'Нет в наличии' },
  }[locale === 'en' || locale === 'uz' ? locale : 'ru'];
  const availabilityLabel = preorderOnly
    ? localizedAvailability.preorder
    : unavailable
      ? localizedAvailability.unavailable
      : undefined;
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [favoriteError, setFavoriteError] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [compareLimitError, setCompareLimitError] = useState(false);
  const actionPending = useRef(false);
  const isCompared = useCompareStore((state) => state.isInCompare(product.id));
  const addCompare = useCompareStore((state) => state.add);
  const removeCompare = useCompareStore((state) => state.remove);
  const labels = {
    ru: { compare: isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению', favorite: isFavorite ? 'Убрать из избранного' : 'Добавить в избранное', compareLimit: 'Можно сравнить не более 4 товаров.' },
    uz: { compare: isCompared ? 'Taqqoslashdan olib tashlash' : 'Taqqoslashga qo‘shish', favorite: isFavorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish', compareLimit: 'Ko‘pi bilan 4 ta mahsulotni taqqoslash mumkin.' },
    en: { compare: isCompared ? 'Remove from comparison' : 'Add to comparison', favorite: isFavorite ? 'Remove from favorites' : 'Add to favorites', compareLimit: 'You can compare up to 4 products.' },
  }[locale === 'en' || locale === 'uz' ? locale : 'ru'];

  const toggleFavoriteProduct = async () => {
    if (actionPending.current || favoritePending) return;
    setFavoriteError(false);
    setCompareLimitError(false);
    if (!isAuthenticated) {
      toggleFavorite(product.id);
      trackCommerceEvent({ eventName: isFavorite ? 'favorite_remove' : 'favorite_add', metadata: { productId: product.id } });
      return;
    }
    actionPending.current = true;
    setFavoritePending(true);
    try {
      if (isFavorite) await removeWishlistItem(product.id);
      else await addWishlistItem(product.id);
      toggleFavorite(product.id);
      trackCommerceEvent({ eventName: isFavorite ? 'favorite_remove' : 'favorite_add', metadata: { productId: product.id } });
    } catch {
      setFavoriteError(true);
    } finally {
      actionPending.current = false;
      setFavoritePending(false);
    }
  };

  const toggleComparedProduct = () => {
    setCompareLimitError(false);
    if (isCompared) {
      removeCompare(product.id);
      trackCommerceEvent({ eventName: 'compare_remove', metadata: { productId: product.id } });
      return;
    }
    if (!addCompare(product.id)) setCompareLimitError(true);
    else trackCommerceEvent({ eventName: 'compare_add', metadata: { productId: product.id } });
  };

  return (
    <article className="group relative h-full min-w-0 overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm motion-safe:transition-[transform,box-shadow,border-color] motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300 motion-safe:hover:shadow-lg dark:border-white/10 dark:bg-stone-900 dark:motion-safe:hover:border-white/20">
      <Link
        href={`/${locale}/catalog/${product.slug}${catalogQuery ? `?${catalogQuery}` : ''}`}
        className="block"
      >
        <div className="relative h-52 overflow-hidden bg-stone-100 sm:h-56 dark:bg-stone-800">
          <ProductImage src={image} alt={title} />
          {availabilityLabel ? (
            <span className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${preorderOnly ? 'bg-amber-100 text-amber-900' : 'bg-stone-800/90 text-white'}`}>
              {availabilityLabel}
            </span>
          ) : null}
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
        <button type="button" aria-label={labels.compare} aria-pressed={isCompared} onClick={toggleComparedProduct} className={`flex size-10 items-center justify-center rounded-full border border-stone-300/80 bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-colors hover:border-primary-500 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/20 dark:bg-stone-900/90 dark:text-stone-100 dark:hover:text-primary-300 ${isCompared ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200' : ''}`}><Scale size={17} /></button>
        <button type="button" aria-label={labels.favorite} aria-pressed={isFavorite} disabled={favoritePending} onClick={() => void toggleFavoriteProduct()} className={`flex size-10 items-center justify-center rounded-full border border-stone-300/80 bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-colors hover:border-rose-500 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-60 dark:border-white/20 dark:bg-stone-900/90 dark:text-stone-100 dark:hover:text-rose-300 ${isFavorite ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200' : ''}`}><Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      </div>
      {favoriteError && <p role="alert" className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-xs text-rose-700 shadow dark:bg-stone-800 dark:text-rose-200">{locale === 'uz' ? 'Tanlanganlarni yangilab bo‘lmadi.' : locale === 'en' ? 'Could not update wishlist.' : 'Не удалось обновить избранное.'}</p>}
      {compareLimitError && <p role="status" className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-xs text-stone-700 shadow dark:bg-stone-800 dark:text-stone-200">{labels.compareLimit}</p>}
    </article>
  );
}
