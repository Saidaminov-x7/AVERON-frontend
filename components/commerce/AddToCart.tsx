'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QuantityStepper } from '@/components/commerce/QuantityStepper';
import { ProductVariantSelector, isVariantUnavailable } from '@/components/commerce/ProductVariantSelector';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { getCommerceErrorCode } from '@/lib/commerce-orders';
import { getSafeInternalReturnTo } from '@/lib/safe-navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface PurchaseVariant {
  id: string;
  color?: string | null;
  size?: string | null;
  stock?: number;
  available?: boolean;
  salePriceUzs?: string | number;
}

const pendingCartIntentStorageKey = 'averon:pending-cart-intent';

const labels = {
  ru: {
    signInTitle: 'Войдите, чтобы продолжить', signInDescription: 'После входа товар автоматически добавится в корзину.', close: 'Закрыть', login: 'Войти', register: 'Регистрация',
    choose: 'Выберите вариант', chooseValue: 'Выберите', quantity: 'Количество', decrease: 'Уменьшить количество', increase: 'Увеличить количество',
    size: 'Размер', color: 'Цвет',
    add: 'В корзину', buy: 'Купить сейчас', adding: 'Добавляем…', buying: 'Оформляем…', signIn: 'Войдите, чтобы добавить товар в корзину', added: 'Добавлено в корзину',
    goCart: 'Перейти в корзину', unavailable: 'Нет в наличии', available: 'Доступен для заказа',
    stock: 'В наличии', lowStock: 'В наличии', generic: 'Не удалось добавить товар.', noStock: 'Этот товар сейчас недоступен.', cartLimit: 'В корзине уже максимальное количество разных товаров.',
    standard: 'Стандартный', currency: 'сум', preorder: 'Предзаказ', preorderDate: 'Ожидаемая доступность: {date}', discount: 'Скидка {percent}%',
  },
  uz: {
    signInTitle: 'Davom etish uchun tizimga kiring', signInDescription: 'Tizimga kirgach, mahsulot savatchaga avtomatik qo\'shiladi.', close: 'Yopish', login: 'Kirish', register: 'Ro\'yxatdan o\'tish',
    choose: 'Variantni tanlang', chooseValue: 'Tanlang', quantity: 'Miqdor', decrease: 'Miqdorni kamaytirish', increase: 'Miqdorni oshirish',
    size: 'O‘lcham', color: 'Rang',
    add: 'Savatchaga qo‘shish', buy: 'Hozir xarid qilish', adding: 'Qo‘shilmoqda…', buying: 'Rasmiylashtirilmoqda…', signIn: 'Savatchaga qo‘shish uchun tizimga kiring', added: 'Savatchaga qo‘shildi',
    goCart: 'Savatchaga o‘tish', unavailable: 'Mavjud emas', available: 'Buyurtma berish mumkin',
    stock: 'Mavjud', lowStock: 'Mavjud', generic: 'Mahsulotni qo‘shib bo‘lmadi.', noStock: 'Bu mahsulot hozir mavjud emas.', cartLimit: 'Savatchada turli mahsulotlar soni maksimal darajaga yetdi.',
    standard: 'Standart', currency: 'so‘m', preorder: 'Oldindan buyurtma', preorderDate: 'Kutilayotgan mavjudlik: {date}', discount: '{percent}% chegirma',
  },
  en: {
    signInTitle: 'Sign in to continue', signInDescription: 'Your item will be added to your cart after you sign in.', close: 'Close', login: 'Sign in', register: 'Create account',
    choose: 'Choose an option', chooseValue: 'Choose', quantity: 'Quantity', decrease: 'Decrease quantity', increase: 'Increase quantity',
    size: 'Size', color: 'Color',
    add: 'Add to cart', buy: 'Buy now', adding: 'Adding…', buying: 'Processing…', signIn: 'Sign in to add this product to your cart', added: 'Added to cart',
    goCart: 'View cart', unavailable: 'Out of stock', available: 'Available to order',
    stock: 'In stock', lowStock: 'In stock', generic: 'Could not add this product.', noStock: 'This product is currently unavailable.', cartLimit: 'Your cart already has the maximum number of different items.',
    standard: 'Standard', currency: 'UZS', preorder: 'Preorder', preorderDate: 'Estimated availability: {date}', discount: '{percent}% off',
  },
} as const;

function formatUzs(amount: string | number, locale: string, currency: string) {
  const value = Number(amount);
  const formatted = Number.isFinite(value)
    ? value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')
    : '0';
  return `${formatted} ${currency}`;
}

function formatColorLabel(value: string, locale: string) {
  const name = value.split('::')[0].trim();
  if (locale !== 'ru') return name;
  const labelsByColor: Record<string, string> = {
    blue: 'синий', navy: 'тёмно-синий', 'dark blue': 'тёмно-синий', 'dark-blue': 'тёмно-синий',
    red: 'красный', black: 'чёрный', white: 'белый', green: 'зелёный', gray: 'серый', grey: 'серый',
    yellow: 'жёлтый', pink: 'розовый', purple: 'фиолетовый', brown: 'коричневый', orange: 'оранжевый',
  };
  return labelsByColor[name.toLocaleLowerCase()] ?? name;
}

export function AddToCart({
  productId,
  productPrice,
  productCompareAtPrice,
  productStock,
  productAvailable,
  productAvailability,
  variants,
}: {
  productId: string;
  productPrice: string | number;
  productCompareAtPrice?: string | number | null;
  productStock?: number;
  productAvailable?: boolean;
  productAvailability?: {
    preorderEligible: boolean;
    preorderAvailable: number;
    estimatedAvailableAt: string | null;
  };
  variants: PurchaseVariant[];
}) {
  const locale = useLocale();
  const text = labels[locale as keyof typeof labels] ?? labels.ru;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [variantId, setVariantId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const autoAddAttempted = useRef<string | null>(null);
  const [activeAction, setActiveAction] = useState<'add' | 'buy' | null>(null);
  const { isAuthenticated, isLoading } = useAuthStore();
  const { mutation } = useCommerceCart();
  const addIntent = searchParams.get('addToCart') === '1';
  const intentVariantId = searchParams.get('cartVariant');
  const intentQuantity = Number(searchParams.get('cartQuantity'));
  const hasSizeOptions = variants.some((variant) => Boolean(variant.size));
  const hasColorOptions = variants.some((variant) => Boolean(variant.color));
  const selectedVariant = variants.find((variant) => variant.id === variantId &&
    (!hasSizeOptions || variant.size === selectedSize) && (!hasColorOptions || variant.color === selectedColor));
  const requiredVariantFields = new Set(variants.flatMap((variant) => [
    ...(variant.size ? ['size' as const] : []),
    ...(variant.color ? ['color' as const] : []),
  ]));
  const selectionComplete = !requiredVariantFields.size || (Boolean(selectedVariant) &&
    [...requiredVariantFields].every((field) => Boolean(selectedVariant?.[field])));
  const selectionRequired = hasSizeOptions || hasColorOptions;
  const availability = selectionRequired && !selectedVariant ? undefined : selectedVariant?.available ?? productAvailable;
  const stock = selectionRequired && !selectedVariant ? undefined : selectedVariant?.stock ?? productStock;
  const stockIsKnown = typeof stock === 'number' && Number.isSafeInteger(stock) && stock >= 0;
  const preorderAvailable = productAvailability?.preorderEligible
    ? Math.max(0, productAvailability.preorderAvailable)
    : 0;
  const canPreorder = preorderAvailable > 0;
  const unavailable = (availability === false && !canPreorder) || (stockIsKnown && stock === 0 && !canPreorder);
  const maxQuantity = stockIsKnown
    ? Math.min(Math.max(stock!, canPreorder ? preorderAvailable : 0), 99)
    : canPreorder
      ? Math.min(preorderAvailable, 99)
      : 99;
  const isPreorder = canPreorder && (!stockIsKnown || quantity > stock!);
  const selectedPrice = selectedVariant?.salePriceUzs ?? productPrice;
  const currentPriceValue = Number(selectedPrice);
  const compareAtPriceValue = Number(productCompareAtPrice);
  const showCompareAtPrice = (!selectedVariant || Number(selectedVariant.salePriceUzs ?? productPrice) === Number(productPrice))
    && Number.isFinite(compareAtPriceValue)
    && Number.isFinite(currentPriceValue)
    && compareAtPriceValue > currentPriceValue;
  const discountPercent = showCompareAtPrice
    ? Math.round((1 - currentPriceValue / compareAtPriceValue) * 100)
    : null;
  const estimatedDate = productAvailability?.estimatedAvailableAt
    ? new Date(productAvailability.estimatedAvailableAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')
    : null;
  const stockStatus = unavailable
    ? text.unavailable
    : isPreorder
      ? `${text.preorder}${estimatedDate ? ` · ${text.preorderDate.replace('{date}', estimatedDate)}` : ''}`
      : stockIsKnown && stock! > 0
      ? text.stock.replace('{count}', String(stock))
      : availability === true
        ? text.available
        : null;
  const errorCode = getCommerceErrorCode(mutation.error);
  const error = mutation.isError
    ? errorCode === 'CART_ITEM_LIMIT'
      ? text.cartLimit
      : errorCode === 'PRODUCT_NOT_AVAILABLE' || errorCode === 'INSUFFICIENT_STOCK'
      ? text.noStock
      : text.generic
    : null;

  useEffect(() => {
    if (!isAuthenticated || !addIntent || isLoading || mutation.isPending) return;
    let pendingIntent: { productId?: string; destination?: string } | null = null;
    try {
      const storedIntent: unknown = JSON.parse(sessionStorage.getItem(pendingCartIntentStorageKey) ?? 'null');
      if (typeof storedIntent === 'object' && storedIntent !== null) {
        pendingIntent = storedIntent as { productId?: string; destination?: string };
      }
    } catch {
      sessionStorage.removeItem(pendingCartIntentStorageKey);
    }
    const currentDestination = getSafeInternalReturnTo(`${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`, locale);
    if (!pendingIntent || pendingIntent.productId !== productId || pendingIntent.destination !== currentDestination) return;
    const intentVariant = variants.find((variant) => variant.id === intentVariantId);
    if (intentVariantId && (!intentVariant || isVariantUnavailable(intentVariant.available, intentVariant.stock))) return;
    const nextVariantId = intentVariant && !isVariantUnavailable(intentVariant.available, intentVariant.stock)
      ? intentVariant.id
      : selectedVariant?.id;
    if (variants.length > 0 && (!nextVariantId || unavailable)) return;
    const nextQuantity = Number.isSafeInteger(intentQuantity) && intentQuantity > 0
      ? Math.min(intentQuantity, 99, maxQuantity)
      : 1;
    const key = `${productId}:${nextVariantId ?? ''}:${nextQuantity}`;
    if (autoAddAttempted.current === key) return;
    autoAddAttempted.current = key;
    setVariantId(nextVariantId ?? '');
    setQuantity(nextQuantity);
    setActiveAction('add');
    mutation.mutate(
      { type: 'add', productId, variantId: nextVariantId, quantity: nextQuantity },
      {
        onSuccess: () => {
          if (intentVariant) {
            setSelectedSize(intentVariant.size ?? '');
            setSelectedColor(intentVariant.color ?? '');
          }
          setAdded(true);
          sessionStorage.removeItem(pendingCartIntentStorageKey);
          const cleanQuery = new URLSearchParams(searchParams.toString());
          cleanQuery.delete('addToCart');
          cleanQuery.delete('cartVariant');
          cleanQuery.delete('cartQuantity');
          const suffix = cleanQuery.toString();
          router.replace(`${pathname}${suffix ? `?${suffix}` : ''}`, { scroll: false });
        },
        onSettled: () => setActiveAction(null),
      },
    );
  }, [addIntent, intentQuantity, intentVariantId, isAuthenticated, isLoading, locale, maxQuantity, mutation, pathname, productId, requiredVariantFields.size, router, searchParams, selectedVariant?.id, unavailable, variants]);

  const getReturnToWithCartIntent = () => {
    const destination = getSafeInternalReturnTo(`${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`, locale) ?? `/${locale}/catalog`;
    const url = new URL(destination, 'https://averon.invalid');
    url.searchParams.set('addToCart', '1');
    if (selectedVariant?.id) url.searchParams.set('cartVariant', selectedVariant.id);
    url.searchParams.set('cartQuantity', String(quantity));
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const handleAdd = () => {
    if (activeAction || mutation.isPending || !selectionComplete) return;
    setAdded(false);
    setActiveAction('add');
    mutation.mutate(
      {
        type: 'add',
        productId,
        variantId: selectedVariant?.id,
        quantity,
      },
      { onSuccess: () => setAdded(true), onSettled: () => setActiveAction(null) },
    );
  };

  const handleBuyNow = () => {
    if (activeAction || mutation.isPending || !selectionComplete) return;
    setActiveAction('buy');
    mutation.mutate(
      { type: 'add', productId, variantId: selectedVariant?.id, quantity },
      { onSuccess: () => router.push(`/${locale}/checkout`), onSettled: () => setActiveAction(null) },
    );
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
        <p className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {formatUzs(selectedPrice, locale, text.currency)}
        </p>
        {showCompareAtPrice && (
          <>
            <del className="text-sm text-[var(--color-muted)]">{formatUzs(productCompareAtPrice!, locale, text.currency)}</del>
            <span className="bg-[var(--color-error)] px-2 py-1 text-xs font-semibold text-white">
              {text.discount.replace('{percent}', String(discountPercent))}
            </span>
          </>
        )}
      </div>
      {stockStatus && (
        <p
          role={unavailable ? 'status' : undefined}
          aria-live="polite"
          className={unavailable ? 'text-sm font-semibold text-[var(--color-error)]' : 'text-sm text-[var(--color-text-secondary)]'}
        >
          {stockStatus}
        </p>
      )}
      {variants.length > 0 && (
        <ProductVariantSelector
          variants={variants}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          label={text.choose}
          sizeLabel={text.size}
          colorLabel={text.color}
          chooseLabel={text.chooseValue}
          formatColorLabel={(color) => formatColorLabel(color, locale)}
          availabilityLabel={(available) => available ? text.available : text.unavailable}
          onChange={(next) => {
            setSelectedSize(next.size);
            setSelectedColor(next.color);
            const nextVariant = variants.find((variant) => (!hasSizeOptions || variant.size === next.size) && (!hasColorOptions || variant.color === next.color));
            setVariantId(nextVariant?.id ?? '');
            setQuantity(1);
            setAdded(false);
          }}
        />
      )}
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">{text.quantity}</p>
          <QuantityStepper
            label={text.quantity}
            value={quantity}
            max={maxQuantity}
            disabled={unavailable}
            onChange={(next) => setQuantity(next)}
            decreaseLabel={text.decrease}
            increaseLabel={text.increase}
          />
        </div>
        {isAuthenticated || unavailable ? (
          <Button
            type="button"
            onClick={handleAdd}
            loading={activeAction === 'add'}
            loadingLabel={text.adding}
            disabled={!isAuthenticated || isLoading || mutation.isPending || activeAction !== null || unavailable || !selectionComplete || quantity > maxQuantity}
            className="h-11 min-w-48 flex-1 font-semibold"
          >
            <ShoppingCart size={17} className="mr-2" aria-hidden="true" />{unavailable ? text.unavailable : text.add}
          </Button>
        ) : (
          <Button type="button" onClick={() => selectionComplete && setAuthPromptOpen(true)} disabled={!selectionComplete} className="min-h-11 min-w-48 flex-1 text-center">
            <ShoppingCart size={17} className="mr-2" aria-hidden="true" />{text.add}
          </Button>
        )}
      </div>
      {isAuthenticated && !unavailable && (
        <Button
          type="button"
          onClick={handleBuyNow}
          loading={activeAction === 'buy'}
          loadingLabel={text.buying}
          disabled={isLoading || mutation.isPending || activeAction !== null || quantity > maxQuantity}
          variant="outline"
          className="min-h-11 px-4 text-sm font-semibold"
        >
          {text.buy}
        </Button>
      )}
      {added && <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{text.added} · <Link href={`/${locale}/cart`} className="underline underline-offset-2">{text.goCart}</Link></p>}
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <Modal isOpen={authPromptOpen} onClose={() => setAuthPromptOpen(false)} title={text.signInTitle} closeLabel={text.close}>
        <p className="mb-5 text-sm text-[var(--color-text-secondary)]">{text.signInDescription}</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/${locale}/login?returnTo=${encodeURIComponent(getReturnToWithCartIntent())}`} onClick={() => sessionStorage.setItem(pendingCartIntentStorageKey, JSON.stringify({ productId, destination: getReturnToWithCartIntent() }))} className="averon-primary-button inline-flex min-h-11 items-center justify-center px-4 text-center">{text.login}</Link>
          <Link href={`/${locale}/register?returnTo=${encodeURIComponent(getReturnToWithCartIntent())}`} onClick={() => sessionStorage.setItem(pendingCartIntentStorageKey, JSON.stringify({ productId, destination: getReturnToWithCartIntent() }))} className="averon-secondary-button inline-flex min-h-11 items-center justify-center px-4 text-center">{text.register}</Link>
        </div>
      </Modal>
    </div>
  );
}
