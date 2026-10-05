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
import { useEffect, useRef, useState } from 'react';

export type { StoreProduct } from '@/lib/products';
export { productTitle } from '@/lib/products';

const NEW_PRODUCT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function isProductNew(createdAt: string | undefined, now = Date.now()) {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  const age = now - createdTime;
  return Number.isFinite(createdTime) && age >= 0 && age < NEW_PRODUCT_WINDOW_MS;
}

export function parseProductColor(value: string) {
  const [name, hex] = value.split('::').map((part) => part.trim());
  return { name, hex: /^#[0-9a-fA-F]{6}$/.test(hex ?? '') ? hex.toUpperCase() : '#D6D3D1' };
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
  const [secondImageAvailable, setSecondImageAvailable] = useState(Boolean(images[1]));
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
  const actionPending = useRef(false);
  const isCompared = useCompareStore((state) => state.isInCompare(product.id));
  const addCompare = useCompareStore((state) => state.add);
  const removeCompare = useCompareStore((state) => state.remove);
  const labels = {
    ru: { compare: isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению', favorite: isFavorite ? 'Убрать из избранного' : 'Добавить в избранное', compareLimit: 'Можно сравнить не более 4 товаров.', available: 'В наличии', country: 'Страна', category: 'Категория' },
    uz: { compare: isCompared ? 'Taqqoslashdan olib tashlash' : 'Taqqoslashga qo‘shish', favorite: isFavorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish', compareLimit: 'Ko‘pi bilan 4 ta mahsulotni taqqoslash mumkin.', available: 'Mavjud', country: 'Mamlakat', category: 'Toifa' },
    en: { compare: isCompared ? 'Remove from comparison' : 'Add to comparison', favorite: isFavorite ? 'Remove from favorites' : 'Add to favorites', compareLimit: 'You can compare up to 4 products.', available: 'Available', country: 'Country', category: 'Category' },
  }[locale === 'en' || locale === 'uz' ? locale : 'ru'];
  const compareButtonStateClass = isCompared
    ? 'bg-[var(--color-text)] text-[var(--color-surface)] ring-[var(--color-text)] hover:bg-[var(--color-text-secondary)]'
    : 'bg-[var(--color-surface)] text-[var(--color-text)] ring-[var(--color-border)] hover:bg-[var(--color-surface-soft)] hover:ring-[var(--color-border-hover)]';
  const variants = product.variants ?? [];
  const colors = [...new Set(variants.map(({ color }) => color).filter((color): color is string => Boolean(color)))].map(parseProductColor);
  const [isNew, setIsNew] = useState(false);
  useEffect(() => {
    const updateNewState = () => setIsNew(isProductNew(product.createdAt));
    updateNewState();
    if (!product.createdAt || !isProductNew(product.createdAt)) return;
    const expiration = new Date(product.createdAt).getTime() + NEW_PRODUCT_WINDOW_MS - Date.now();
    const timeout = window.setTimeout(() => setIsNew(false), expiration);
    return () => window.clearTimeout(timeout);
  }, [product.createdAt]);
  const newLabel = locale === 'uz' ? 'Yangi' : locale === 'en' ? 'New' : 'Новинка';
  const currentPrice = Number(product.salePriceUzs);
  const compareAtPrice = Number(product.compareAtPriceUzs);
  const discountPercent = Number.isFinite(currentPrice) && currentPrice > 0
    && Number.isFinite(compareAtPrice) && compareAtPrice > currentPrice
    ? Math.round((1 - currentPrice / compareAtPrice) * 100)
    : null;
  const discountLabel = locale === 'uz'
    ? `Chegirma ${discountPercent}%`
    : locale === 'en'
      ? `${discountPercent}% off`
      : `Скидка ${discountPercent}%`;

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
      className="group relative h-full min-w-0 pb-3"
      onMouseEnter={() => setImageIndex(secondImageAvailable ? 1 : 0)}
      onMouseLeave={() => setImageIndex(0)}
      onFocusCapture={() => setImageIndex(secondImageAvailable ? 1 : 0)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setImageIndex(0);
      }}
    >
      <Link
        href={productHref}
        className="block rounded-[var(--radius-control)] focus-visible:outline-none"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-image-surface)]">
          <ProductImage
            src={images[imageIndex] || images[0]}
            alt={plainTitle}
            zoomOnHover={false}
            fit="contain"
            onError={imageIndex === 1 ? () => {
              setSecondImageAvailable(false);
              setImageIndex(0);
            } : undefined}
          />
          {(preorderOnly || unavailable) && (
            <span className="absolute left-2 top-2 bg-[var(--color-overlay)] px-1.5 py-1 text-[9px] font-semibold uppercase tracking-[.06em] text-white">
              {availabilityLabel}
            </span>
          )}
          {secondImageAvailable ? (
            <div className="absolute bottom-2 left-2 flex gap-1 bg-[var(--color-overlay)] px-1.5 py-1" aria-hidden="true">
              {images.map((_, index) => <span key={index} className={`h-1 w-1/2 rounded-full transition-colors ${imageIndex === index ? 'bg-white' : 'bg-white/45'}`} />)}
            </div>
          ) : null}
        </div>
        <div className="pt-2">
          {colors.length > 0 && (
            <div className="mb-1.5 flex items-center gap-1" aria-label={locale === 'en' ? 'Available colors' : locale === 'uz' ? 'Mavjud ranglar' : 'Доступные цвета'}>
              {colors.slice(0, 6).map(({ name, hex }) => (
                <span key={`${name}-${hex}`} title={name} className="size-3.5 rounded-full border border-black/10 ring-1 ring-white" style={{ backgroundColor: hex }} />
              ))}
              {colors.length > 6 ? <span className="ml-0.5 text-[11px] text-[var(--color-muted)]">+{colors.length - 6}</span> : null}
            </div>
          )}
          <div className="mb-1 flex min-h-4 items-center gap-2">
            {discountPercent !== null ? <span aria-label={discountLabel} className="text-[10px] font-bold uppercase tracking-[.04em] text-[var(--color-sale)]">−{discountPercent}%</span> : null}
            {isNew ? <span className="text-[10px] font-bold uppercase tracking-[.04em] text-[var(--color-text)]">{newLabel}</span> : null}
          </div>
          <p className="line-clamp-2 text-[13px] font-normal leading-[1.35] text-[var(--color-text)] sm:text-[15px]">
            <ProductRichText content={title} inline />
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className={`text-sm font-semibold tabular-nums tracking-tight ${discountPercent !== null ? 'text-[var(--color-sale)]' : 'text-[var(--color-text)]'}`}>{price} {currency}</strong>
            {discountPercent !== null ? <span className="text-xs tabular-nums text-[var(--color-muted)] line-through">{compareAtPrice.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')} {currency}</span> : null}
          </div>
        </div>
      </Link>
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={labels.compare}
          aria-pressed={isCompared}
          onClick={toggleComparedProduct}
          className={`flex size-9 items-center justify-center rounded-sm ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] ${compareButtonStateClass}`}
        >
          <Scale size={17} />
        </button>
        <button
          type="button"
          aria-label={labels.favorite}
          aria-pressed={isFavorite}
          disabled={favoritePending}
          onClick={() => void toggleFavoriteProduct()}
          className={`flex size-9 items-center justify-center rounded-sm ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-wait disabled:opacity-60 ${
            isFavorite
              ? 'bg-[var(--color-text)] text-[var(--color-surface)] ring-[var(--color-text)]'
              : 'bg-[var(--color-surface)] text-[var(--color-text)] ring-[var(--color-border)] hover:bg-[var(--color-surface-soft)] hover:ring-[var(--color-border-hover)]'
          }`}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      {favoriteError && <p role="alert" className="mt-2 px-1 text-xs text-rose-700 dark:text-rose-300">{locale === 'uz' ? 'Tanlanganlarni yangilab bo‘lmadi.' : locale === 'en' ? 'Could not update wishlist.' : 'Не удалось обновить избранное.'}</p>}
      {compareLimitError && <p role="status" className="mt-2 px-1 text-xs text-[var(--color-text-secondary)]">{labels.compareLimit}</p>}
    </article>
  );
}
