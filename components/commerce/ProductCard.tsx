'use client';

import Link from 'next/link';
import { Heart, Scale } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';
import { productPlainText, productRouteId, productTitle, type StoreProduct } from '@/lib/products';
import { ProductRichText } from './ProductRichText';
import { addWishlistItem, removeWishlistItem } from '@/lib/commerce-orders';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';
import { useAuthStore } from '@/store/useAuthStore';
import { categoryName } from '@/lib/products';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export type { StoreProduct } from '@/lib/products';
export { productTitle } from '@/lib/products';

export function getScrubbedImageIndex(pointerX: number, left: number, width: number, imageCount: number) {
  if (imageCount <= 1 || width <= 0) return 0;
  return Math.max(0, Math.min(imageCount - 1, Math.floor(((pointerX - left) / width) * imageCount)));
}

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
  const plainTitle = productPlainText(title);
  const productHref = `/${locale}/catalog/${encodeURIComponent(productRouteId(product))}${catalogQuery ? `?${catalogQuery}` : ''}`;
  const images = product.images?.map(({ url }) => url).filter(Boolean) ?? [];
  const [imageIndex, setImageIndex] = useState(0);
  const image = images[imageIndex];
  const price = Number(product.salePriceUzs || 0).toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU');
  const currency = locale === 'en' ? 'UZS' : locale === 'uz' ? "so'm" : 'сум';
  const preorderOnly = product.recommendationAvailability
    ? product.recommendationAvailability.preorder
    : Boolean(product.availability?.preorderEligible && !product.availability.inStock);
  const unavailable = product.recommendationAvailability
    ? !product.recommendationAvailability.available
    : Boolean(product.availability && !product.availability.inStock && !product.availability.preorderEligible);
  const localizedAvailability = {
    en: { preorder: 'Preorder', unavailable: 'Out of stock', available: 'In stock' },
    uz: { preorder: 'Oldindan buyurtma', unavailable: 'Mavjud emas', available: 'Mavjud' },
    ru: { preorder: 'Предзаказ', unavailable: 'Нет в наличии', available: 'В наличии' },
  }[locale === 'en' || locale === 'uz' ? locale : 'ru'];
  const availabilityLabel = preorderOnly
    ? localizedAvailability.preorder
    : unavailable
      ? localizedAvailability.unavailable
      : product.availability || product.recommendationAvailability
        ? localizedAvailability.available
        : undefined;
  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [favoriteError, setFavoriteError] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [compareLimitError, setCompareLimitError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const actionPending = useRef(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const isCompared = useCompareStore((state) => state.isInCompare(product.id));
  const addCompare = useCompareStore((state) => state.add);
  const removeCompare = useCompareStore((state) => state.remove);
  const labels = {
    ru: { compare: isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению', favorite: isFavorite ? 'Убрать из избранного' : 'Добавить в избранное', compareLimit: 'Можно сравнить не более 4 товаров.', available: 'В наличии', details: 'Подробнее о товаре', country: 'Страна', category: 'Категория' },
    uz: { compare: isCompared ? 'Taqqoslashdan olib tashlash' : 'Taqqoslashga qo‘shish', favorite: isFavorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish', compareLimit: 'Ko‘pi bilan 4 ta mahsulotni taqqoslash mumkin.', available: 'Mavjud', details: 'Mahsulot haqida batafsil', country: 'Mamlakat', category: 'Toifa' },
    en: { compare: isCompared ? 'Remove from comparison' : 'Add to comparison', favorite: isFavorite ? 'Remove from favorites' : 'Add to favorites', compareLimit: 'You can compare up to 4 products.', available: 'Available', details: 'View product details', country: 'Country', category: 'Category' },
  }[locale === 'en' || locale === 'uz' ? locale : 'ru'];
  const descriptionValue = product.description?.[locale];
  const description = (typeof descriptionValue === 'string' ? descriptionValue : descriptionValue?.text)?.trim();
  const variants = product.variants ?? [];
  const sizes = [...new Set(variants.map(({ size }) => size).filter((size): size is string => Boolean(size)))];
  const colors = [...new Set(variants.map(({ color }) => color).filter((color): color is string => Boolean(color)))];
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    setIsNew(Boolean(product.createdAt && Date.now() - new Date(product.createdAt).getTime() <= 14 * 24 * 60 * 60 * 1000));
  }, [product.createdAt]);
  const newLabel = locale === 'uz' ? 'Yangi' : locale === 'en' ? 'New' : 'Новинка';

  const startPreviewTimer = () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewOpen(true), 3000);
  };
  const stopPreview = () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = null;
    setPreviewOpen(false);
  };
  const scrubImage = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || images.length <= 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setImageIndex(getScrubbedImageIndex(event.clientX, bounds.left, bounds.width, images.length));
  };

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
    <article
      className={`group relative h-full min-w-0 pb-3 motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_12px_28px_-18px_rgba(17,17,17,.35)] focus-within:shadow-[0_12px_28px_-18px_rgba(17,17,17,.35)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[var(--color-primary)] after:transition-transform group-hover:after:scale-x-100 group-focus-within:after:scale-x-100 ${previewOpen ? 'z-20' : ''}`}
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') startPreviewTimer(); }}
      onPointerLeave={() => { stopPreview(); setImageIndex(0); }}
      onFocusCapture={startPreviewTimer}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) stopPreview();
      }}
    >
      <Link
        href={productHref}
        className="block rounded-[var(--radius-control)] focus-visible:outline-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-surface-soft)]" onPointerMove={scrubImage} onPointerLeave={() => setImageIndex(0)}>
          <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.025] group-focus-within:scale-[1.015]">
            <ProductImage src={image} alt={plainTitle} />
          </div>
          {isNew ? (
            <span className="absolute left-3 top-3 bg-black px-2 py-1 text-[10px] font-bold text-white">{newLabel}</span>
          ) : availabilityLabel ? (
            <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] shadow-sm backdrop-blur-md ${preorderOnly ? 'bg-white/90 text-stone-900 dark:bg-stone-900/90 dark:text-white' : unavailable ? 'bg-stone-900/90 text-white' : 'bg-white/90 text-stone-900 dark:bg-stone-900/90 dark:text-white'}`}>
              {availabilityLabel}
            </span>
          ) : null}
          {images.length > 1 ? (
            <div className="absolute bottom-3 left-3 flex gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm" aria-hidden="true">
              {images.map((_, index) => <span key={index} className={`h-1 w-3 rounded-full transition-colors ${imageIndex === index ? 'bg-white' : 'bg-white/45'}`} />)}
            </div>
          ) : null}
        </div>
        <div className="px-1 pt-3">
          <div className="mb-1.5 flex min-h-4 items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--color-muted)]">
            {product.country ? <span>{product.country}</span> : null}
            {product.country && product.category ? <span className="size-1 rounded-full bg-[var(--color-muted)]/60" aria-hidden="true" /> : null}
            {product.category ? <span className="truncate">{categoryName(product.category, locale)}</span> : null}
          </div>
          <p className="line-clamp-2 min-h-10 text-[13px] font-medium leading-5 text-[var(--color-text)] sm:text-sm">
            <ProductRichText content={title} inline />
          </p>
          {(sizes.length > 0 || colors.length > 0) && (
            <p className="mt-1 truncate text-[11px] text-[var(--color-muted)]">
              {[sizes.slice(0, 4).join(' / '), colors.slice(0, 2).join(', ')].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-sm font-bold tabular-nums tracking-tight text-[var(--color-text)] sm:text-base">{price} {currency}</strong>
            {product.compareAtPriceUzs ? <span className="text-xs tabular-nums text-[var(--color-muted)] line-through">{Number(product.compareAtPriceUzs).toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')} {currency}</span> : null}
          </div>
        </div>
      </Link>
      {previewOpen && (
        <div className={`px-1 pt-3 text-xs text-[var(--color-text-secondary)] ${reduceMotion ? '' : 'animate-in fade-in slide-in-from-top-1 duration-200'}`}>
          <div className="line-clamp-3 leading-5">
            <ProductRichText content={description || title} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-muted)]">
            {product.category ? <span>{labels.category}: {categoryName(product.category, locale)}</span> : null}
            {product.country ? <span>{labels.country}: {product.country}</span> : null}
            {availabilityLabel ? <span>{availabilityLabel}</span> : null}
          </div>
          <Link
            href={productHref}
            className="mt-2 inline-flex font-semibold text-[var(--color-text)] underline decoration-[var(--color-muted)] underline-offset-4 hover:decoration-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {labels.details}
          </Link>
        </div>
      )}
      <div className="absolute right-3 top-3 flex gap-2">
        <button type="button" aria-label={labels.compare} aria-pressed={isCompared} onClick={toggleComparedProduct} className={`flex size-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-md transition-[background-color,color,transform] hover:scale-105 hover:bg-white hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-stone-900/90 dark:text-stone-100 dark:hover:bg-stone-900 ${isCompared ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900' : ''}`}><Scale size={17} /></button>
        <button type="button" aria-label={labels.favorite} aria-pressed={isFavorite} disabled={favoritePending} onClick={() => void toggleFavoriteProduct()} className={`flex size-10 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-md transition-[background-color,color,transform] hover:scale-105 hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-wait disabled:opacity-60 dark:bg-stone-900/90 dark:text-stone-100 dark:hover:bg-stone-900 dark:hover:text-rose-300 ${isFavorite ? 'bg-rose-600 text-white dark:bg-rose-500 dark:text-white' : ''}`}><Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      </div>
      {favoriteError && <p role="alert" className="mt-2 px-1 text-xs text-rose-700 dark:text-rose-300">{locale === 'uz' ? 'Tanlanganlarni yangilab bo‘lmadi.' : locale === 'en' ? 'Could not update wishlist.' : 'Не удалось обновить избранное.'}</p>}
      {compareLimitError && <p role="status" className="mt-2 px-1 text-xs text-[var(--color-text-secondary)]">{labels.compareLimit}</p>}
    </article>
  );
}
