'use client';

import Link from 'next/link';
import { Heart, Scale, ShieldCheck, Check } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useCompareStore } from '@/store/useCompareStore';
import { productTitle, type StoreProduct, categoryName } from '@/lib/products';
import { addWishlistItem, removeWishlistItem } from '@/lib/commerce-orders';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';
import { useAuthStore } from '@/store/useAuthStore';
import { useReducedMotion } from 'framer-motion';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const images = product.images?.map(({ url }) => url).filter(Boolean) ?? [];
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = images[imageIndex];

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

  // Verification check: compact badge on card
  const isVerified = Boolean(
    (product as any).isVerified ||
    (product as any).verification?.isVerified ||
    ((product as any).verification?.supplierVerified && (product as any).verification?.photosMatch)
  );

  const isFavorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [favoriteError, setFavoriteError] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);

  const isCompared = useCompareStore((state) => state.isInCompare(product.id));
  const addCompare = useCompareStore((state) => state.add);
  const removeCompare = useCompareStore((state) => state.remove);
  const [compareLimitError, setCompareLimitError] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const actionPending = useRef(false);
  const reduceMotion = useReducedMotion();

  const labels = {
    ru: {
      compare: isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению',
      favorite: isFavorite ? 'Убрать из избранного' : 'Добавить в избранное',
      compareLimit: 'Можно сравнить не более 4 товаров.',
      available: 'В наличии',
      openProduct: 'Открыть товар',
      details: 'Подробнее о товаре',
      country: 'Страна',
      category: 'Категория',
      verified: 'Проверено',
      infoSection: 'Информация',
      descriptionSection: 'Описание',
      orderSection: 'Заказать',
      colorsCount: (n: number) => `${n} ${n === 1 ? 'цвет' : n < 5 ? 'цвета' : 'цветов'}`,
      sizesLabel: 'Размеры',
    },
    uz: {
      compare: isCompared ? 'Taqqoslashdan olib tashlash' : 'Taqqoslashga qo‘shish',
      favorite: isFavorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish',
      compareLimit: 'Ko‘pi bilan 4 ta mahsulotni taqqoslash mumkin.',
      available: 'Mavjud',
      openProduct: 'Mahsulotni ochish',
      details: 'Batafsil',
      country: 'Mamlakat',
      category: 'Toifa',
      verified: 'Tasdiqlangan',
      infoSection: 'Ma’lumot',
      descriptionSection: 'Tavsif',
      orderSection: 'Buyurtma',
      colorsCount: (n: number) => `${n} ta rang`,
      sizesLabel: 'O‘lchamlar',
    },
    en: {
      compare: isCompared ? 'Remove from comparison' : 'Add to comparison',
      favorite: isFavorite ? 'Remove from favorites' : 'Add to favorites',
      compareLimit: 'You can compare up to 4 products.',
      available: 'Available',
      openProduct: 'Open product',
      details: 'View details',
      country: 'Country',
      category: 'Category',
      verified: 'Verified',
      infoSection: 'Information',
      descriptionSection: 'Description',
      orderSection: 'Order',
      colorsCount: (n: number) => `${n} ${n === 1 ? 'color' : 'colors'}`,
      sizesLabel: 'Sizes',
    },
  }[locale === 'en' || locale === 'uz' ? locale : 'ru'];

  const rawDescription = product.description?.[locale];
  const description = (typeof rawDescription === 'string' ? rawDescription : rawDescription?.text)?.trim();

  const variants = product.variants ?? [];
  const sizes = [...new Set(variants.map(({ size }) => size).filter((s): s is string => Boolean(s)))];
  const colors = [...new Set(variants.map(({ color }) => color).filter((c): c is string => Boolean(c)))];

  const startPreviewTimer = () => {
    if (
      typeof window === 'undefined' ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) return;

    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      const bounds = cardRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(480, window.innerWidth - 24);
      setPreviewPosition({
        top: Math.max(12, Math.min(bounds.top, window.innerHeight - 380)),
        left: Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)),
        width,
      });
      setPreviewOpen(true);
    }, 2000);
  };

  const stopPreview = () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = null;
    setPreviewOpen(false);
    setPreviewPosition(null);
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
      trackCommerceEvent({
        eventName: isFavorite ? 'favorite_remove' : 'favorite_add',
        metadata: { productId: product.id },
      });
      return;
    }

    actionPending.current = true;
    setFavoritePending(true);
    try {
      if (isFavorite) {
        await removeWishlistItem(product.id);
      } else {
        await addWishlistItem(product.id);
      }
      toggleFavorite(product.id);
      trackCommerceEvent({
        eventName: isFavorite ? 'favorite_remove' : 'favorite_add',
        metadata: { productId: product.id },
      });
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
    if (!addCompare(product.id)) {
      setCompareLimitError(true);
    } else {
      trackCommerceEvent({ eventName: 'compare_add', metadata: { productId: product.id } });
    }
  };

  const productHref = `/${locale}/catalog/${product.slug}${catalogQuery ? `?${catalogQuery}` : ''}`;

  return (
    <article
      ref={cardRef}
      className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-primary-400 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900 dark:hover:border-primary-500 ${
        previewOpen ? 'z-20 ring-2 ring-primary-500 shadow-2xl' : ''
      }`}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') startPreviewTimer();
      }}
      onPointerLeave={(event) => {
        if (event.relatedTarget instanceof Node && previewRef.current?.contains(event.relatedTarget)) return;
        stopPreview();
        setImageIndex(0);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) stopPreview();
      }}
    >
      <Link href={productHref} className="flex flex-1 flex-col">
        {/* Media Frame (Fashion aspect ratio 3/4) */}
        <div
          className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 dark:bg-stone-800/80"
          onPointerMove={scrubImage}
          onPointerLeave={() => setImageIndex(0)}
        >
          <ProductImage src={currentImage} alt={title} />

          {/* Top-left Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
            {availabilityLabel ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                  preorderOnly
                    ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/90 dark:text-sky-200'
                    : unavailable
                      ? 'bg-stone-800/90 text-stone-100 dark:bg-stone-800 dark:text-stone-300'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-200'
                }`}
              >
                {availabilityLabel}
              </span>
            ) : null}

            {isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-[11px] font-semibold text-primary-700 backdrop-blur-md dark:bg-primary-950/80 dark:text-primary-300">
                <ShieldCheck size={12} className="text-primary-600 dark:text-primary-400" />
                {labels.verified}
              </span>
            ) : null}
          </div>

          {/* Image scrub pagination indicators */}
          {images.length > 1 ? (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/30 px-2 py-1 backdrop-blur-sm" aria-hidden="true">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`size-1.5 rounded-full transition-all ${
                    imageIndex === index ? 'w-3 bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Card Details */}
        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            {/* Category / Variant Hint */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
              <span>{product.category ? categoryName(product.category, locale) : (colors.length ? labels.colorsCount(colors.length) : '')}</span>
              {sizes.length > 0 ? (
                <span className="truncate max-w-[120px] font-medium">{sizes.slice(0, 3).join(', ')}{sizes.length > 3 ? '…' : ''}</span>
              ) : null}
            </div>

            {/* Title */}
            <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-stone-800 transition-colors group-hover:text-primary-600 dark:text-stone-100 dark:group-hover:text-primary-400">
              {title}
            </h3>
          </div>

          {/* Price Row */}
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-stone-900 dark:text-white">
              {price} {currency}
            </span>
            {product.compareAtPriceUzs ? (
              <span className="text-xs text-stone-400 line-through">
                {Number(product.compareAtPriceUzs).toLocaleString(locale === 'en' ? 'en-US' : 'ru-RU')} {currency}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Floating Action Buttons */}
      <div className="absolute right-3 top-3 flex gap-1.5 z-10">
        <button
          type="button"
          aria-label={labels.compare}
          aria-pressed={isCompared}
          onClick={toggleComparedProduct}
          className={`flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-all hover:border-primary-500 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-stone-700 dark:bg-stone-800/90 dark:text-stone-200 dark:hover:border-primary-500 dark:hover:text-primary-300 ${
            isCompared ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300' : ''
          }`}
        >
          <Scale size={15} />
        </button>
        <button
          type="button"
          aria-label={labels.favorite}
          aria-pressed={isFavorite}
          disabled={favoritePending}
          onClick={() => void toggleFavoriteProduct()}
          className={`flex size-9 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-700 shadow-sm backdrop-blur transition-all hover:border-rose-400 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800/90 dark:text-stone-200 dark:hover:border-rose-500 dark:hover:text-rose-400 ${
            isFavorite ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300' : ''
          }`}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {favoriteError && (
        <p role="alert" className="absolute bottom-2 left-2 rounded-lg bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-600 shadow dark:bg-stone-800 dark:border-red-900/60 dark:text-red-400 z-20">
          {locale === 'uz' ? 'Tanlanganlarni yangilab bo‘lmadi.' : locale === 'en' ? 'Could not update wishlist.' : 'Не удалось обновить избранное.'}
        </p>
      )}
      {compareLimitError && (
        <p role="status" className="absolute bottom-2 left-2 rounded-lg bg-stone-100 border border-stone-300 px-2 py-1 text-xs text-stone-700 shadow dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 z-20">
          {labels.compareLimit}
        </p>
      )}

      {/* 2-Second Hover Preview Overlay via Portal (no layout shift) */}
      {previewOpen && previewPosition ? createPortal(
        <div
          ref={previewRef}
          onPointerLeave={stopPreview}
          className={`fixed z-[1100] overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl ${
            reduceMotion ? '' : 'animate-fade-up'
          } dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100`}
          style={{
            top: previewPosition.top,
            left: previewPosition.left,
            width: previewPosition.width,
          }}
        >
          <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
            <div className="relative aspect-[3/4] bg-stone-100 dark:bg-stone-800">
              <ProductImage src={currentImage} alt={title} />
              {isVerified ? (
                <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-700 backdrop-blur dark:bg-primary-950/80 dark:text-primary-300">
                  <ShieldCheck size={11} />
                  {labels.verified}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-between p-4 min-w-0">
              <div className="space-y-3">
                {/* Mini-section 1: Информация */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    {labels.infoSection}
                  </h4>
                  <p className="mt-1 line-clamp-1 text-sm font-bold text-stone-900 dark:text-white">
                    {title}
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-primary-600 dark:text-primary-400">
                    {price} {currency}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    {product.category ? <span>{categoryName(product.category, locale)}</span> : null}
                    {product.country ? <span>• {product.country}</span> : null}
                    {availabilityLabel ? <span>• {availabilityLabel}</span> : null}
                  </div>
                  {sizes.length > 0 ? (
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      {labels.sizesLabel}: <span className="font-medium text-stone-700 dark:text-stone-300">{sizes.join(', ')}</span>
                    </p>
                  ) : null}
                </div>

                {/* Mini-section 2: Описание */}
                <div className="border-t border-stone-200/80 pt-2.5 dark:border-stone-800">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    {labels.descriptionSection}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 line-clamp-3 dark:text-stone-300">
                    {description ? `${description}…` : title}
                  </p>
                </div>
              </div>

              {/* Mini-section 3: Заказать / CTA */}
              <div className="mt-4 border-t border-stone-200/80 pt-3 dark:border-stone-800">
                <Link
                  href={productHref}
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-primary-600 text-xs font-bold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500"
                >
                  {labels.openProduct}
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </article>
  );
}
