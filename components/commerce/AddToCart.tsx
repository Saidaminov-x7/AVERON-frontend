'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QuantityStepper } from '@/components/commerce/QuantityStepper';
import { ProductVariantSelector, isVariantUnavailable } from '@/components/commerce/ProductVariantSelector';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { getCommerceErrorCode } from '@/lib/commerce-orders';
import { getSafeInternalReturnTo } from '@/lib/safe-navigation';
import { calculateDiscountPercent, formatUzs as formatMoneyUzs } from '@/lib/price';
import { useAuthStore } from '@/store/useAuthStore';

interface PurchaseVariant {
  id: string;
  color?: string | null;
  size?: string | null;
  stock?: number;
  available?: boolean;
  salePriceUzs?: string | number;
}

const purchaseVariantQueryKey = 'purchaseVariantId';
const purchaseQuantityQueryKey = 'purchaseQuantity';
const pendingPurchaseKey = 'averon:pending-product-cart-add:v1';
interface PendingPurchase { productId: string; variantId: string | null; quantity: number; returnTo: string; createdAt: number; }

function getInitialPurchaseSelection(variants: PurchaseVariant[], searchParams: URLSearchParams) {
  const requestedVariantId = searchParams.get(purchaseVariantQueryKey);
  const requestedVariant = variants.find((variant) => variant.id === requestedVariantId);
  // A variant is a required customer choice; never silently select the first one.
  // Only restore a variant explicitly carried through the sign-in/registration flow.
  const selectedVariant = requestedVariant && !isVariantUnavailable(requestedVariant.available, requestedVariant.stock)
    ? requestedVariant
    : undefined;
  const parsedQuantity = Number(searchParams.get(purchaseQuantityQueryKey));
  const requestedQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
  const maxQuantity = typeof selectedVariant?.stock === 'number' && Number.isSafeInteger(selectedVariant.stock) && selectedVariant.stock >= 0
    ? Math.min(Math.max(selectedVariant.stock, 0), 99)
    : 99;

  return {
    variantId: selectedVariant?.id ?? '',
    size: selectedVariant?.size ?? '',
    color: selectedVariant?.color ?? '',
    quantity: Math.max(1, Math.min(requestedQuantity, maxQuantity || 1)),
  };
}

const labels = {
  ru: {
    choose: 'Выберите вариант', quantity: 'Количество', decrease: 'Уменьшить количество', increase: 'Увеличить количество',
    size: 'Размер', color: 'Цвет',
    add: 'Добавить в корзину', buy: 'Купить сейчас', adding: 'Добавляем…', buying: 'Оформляем…', signIn: 'Войти', register: 'Регистрация', authTitle: 'Войти или создать аккаунт', authDescription: 'Чтобы добавить товар в корзину, войдите или зарегистрируйтесь.', added: 'Добавлено в корзину',
    goCart: 'Перейти в корзину', unavailable: 'Нет в наличии', available: 'Доступен для заказа',
    stock: 'В наличии', generic: 'Не удалось добавить товар.', noStock: 'Этот товар сейчас недоступен.',
    standard: 'Стандартный', currency: 'сум', preorder: 'Предзаказ', preorderDate: 'Ожидаемая доступность: {date}', discount: 'Скидка {percent}%',
  },
  uz: {
    choose: 'Variantni tanlang', quantity: 'Miqdor', decrease: 'Miqdorni kamaytirish', increase: 'Miqdorni oshirish',
    size: 'O‘lcham', color: 'Rang',
    add: 'Savatchaga qo‘shish', buy: 'Hozir xarid qilish', adding: 'Qo‘shilmoqda…', buying: 'Rasmiylashtirilmoqda…', signIn: 'Kirish', register: 'Ro‘yxatdan o‘tish', authTitle: 'Kiring yoki hisob yarating', authDescription: 'Mahsulotni savatchaga qo‘shish uchun tizimga kiring yoki ro‘yxatdan o‘ting.', added: 'Savatchaga qo‘shildi',
    goCart: 'Savatchaga o‘tish', unavailable: 'Mavjud emas', available: 'Buyurtma berish mumkin',
    stock: 'Mavjud', generic: 'Mahsulotni qo‘shib bo‘lmadi.', noStock: 'Bu mahsulot hozir mavjud emas.',
    standard: 'Standart', currency: 'so‘m', preorder: 'Oldindan buyurtma', preorderDate: 'Kutilayotgan mavjudlik: {date}', discount: '{percent}% chegirma',
  },
  en: {
    choose: 'Choose an option', quantity: 'Quantity', decrease: 'Decrease quantity', increase: 'Increase quantity',
    size: 'Size', color: 'Color',
    add: 'Add to cart', buy: 'Buy now', adding: 'Adding…', buying: 'Processing…', signIn: 'Sign in', register: 'Create account', authTitle: 'Sign in or create an account', authDescription: 'Sign in or create an account to add this product to your cart.', added: 'Added to cart',
    goCart: 'View cart', unavailable: 'Out of stock', available: 'Available to order',
    stock: 'In stock', generic: 'Could not add this product.', noStock: 'This product is currently unavailable.',
    standard: 'Standard', currency: 'UZS', preorder: 'Preorder', preorderDate: 'Estimated availability: {date}', discount: '{percent}% off',
  },
} as const;

export function AddToCart({
  productId,
  productPrice,
  productCompareAtPrice,
  productStock,
  productAvailable,
  productAvailability,
  variants,
  secondaryAction,
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
  secondaryAction?: ReactNode;
}) {
  const locale = useLocale();
  const text = labels[locale as keyof typeof labels] ?? labels.ru;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialSelection] = useState(() => getInitialPurchaseSelection(variants, searchParams));
  const [variantId, setVariantId] = useState(initialSelection.variantId);
  const [selectedSize, setSelectedSize] = useState(initialSelection.size);
  const [selectedColor, setSelectedColor] = useState(initialSelection.color);
  const [quantity, setQuantity] = useState(initialSelection.quantity);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeAction, setActiveAction] = useState<'add' | 'buy' | null>(null);
  const autoAddHandled = useRef(false);
  const { isAuthenticated, isLoading } = useAuthStore();
  const { mutation } = useCommerceCart();
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const hasVariantSize = variants.some((variant) => Boolean(variant.size));
  const hasVariantColor = variants.some((variant) => Boolean(variant.color));
  const selectionRequired = variants.length > 0 && (hasVariantSize || hasVariantColor)
    && ((!hasVariantSize || Boolean(selectedSize)) && (!hasVariantColor || Boolean(selectedColor)) ? !selectedVariant : true);
  const availability = selectedVariant?.available ?? (variants.length ? undefined : productAvailable);
  const stock = selectedVariant?.stock ?? (variants.length ? undefined : productStock);
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
    ? calculateDiscountPercent(currentPriceValue, compareAtPriceValue)
    : null;
  const returnSearchParams = new URLSearchParams(searchParams.toString());
  if (selectedVariant) returnSearchParams.set(purchaseVariantQueryKey, selectedVariant.id);
  if (quantity > 1) returnSearchParams.set(purchaseQuantityQueryKey, String(quantity));
  else returnSearchParams.delete(purchaseQuantityQueryKey);
  const returnPath = `${pathname}${returnSearchParams.size ? `?${returnSearchParams.toString()}` : ''}`;
  const safeReturnPath = getSafeInternalReturnTo(returnPath, locale) ?? `/${locale}/catalog`;
  const estimatedDate = productAvailability?.estimatedAvailableAt
    ? new Date(productAvailability.estimatedAvailableAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')
    : null;
  const stockStatus = unavailable
    ? text.unavailable
    : isPreorder
      ? `${text.preorder}${estimatedDate ? ` · ${text.preorderDate.replace('{date}', estimatedDate)}` : ''}`
    : stockIsKnown && stock! > 0
      ? text.stock
      : availability === true
        ? text.available
        : null;
  const errorCode = getCommerceErrorCode(mutation.error);
  const error = mutation.isError
    ? errorCode === 'PRODUCT_NOT_AVAILABLE' || errorCode === 'INSUFFICIENT_STOCK'
      ? text.noStock
      : text.generic
    : null;

  const handleAdd = () => {
    if (activeAction || mutation.isPending || selectionRequired) return;
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

  const rememberPurchaseBeforeAuth = () => {
    const intent: PendingPurchase = {
      productId,
      variantId: selectedVariant?.id ?? null,
      quantity,
      returnTo: safeReturnPath,
      createdAt: Date.now(),
    };
    try { window.sessionStorage.setItem(pendingPurchaseKey, JSON.stringify(intent)); } catch { /* Return-to still restores the product selection. */ }
  };

  useEffect(() => {
    if (!isAuthenticated || autoAddHandled.current) return;
    let stored: string | null;
    try { stored = window.sessionStorage.getItem(pendingPurchaseKey); } catch { return; }
    if (!stored) return;
    let intent: PendingPurchase;
    try { intent = JSON.parse(stored) as PendingPurchase; } catch {
      window.sessionStorage.removeItem(pendingPurchaseKey);
      return;
    }
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const now = Date.now();
    const valid = intent.productId === productId
      && intent.variantId === (selectedVariant?.id ?? null)
      && intent.quantity === quantity && Number.isSafeInteger(intent.quantity) && intent.quantity > 0
      && intent.createdAt <= now && now - intent.createdAt < 10 * 60 * 1000
      && intent.returnTo === currentPath;
    window.sessionStorage.removeItem(pendingPurchaseKey);
    if (!valid || selectionRequired || unavailable || quantity > maxQuantity || mutation.isPending) return;
    autoAddHandled.current = true;
    queueMicrotask(() => {
      if (!autoAddHandled.current) return;
      setActiveAction('add');
      mutation.mutate(
        { type: 'add', productId, variantId: selectedVariant?.id, quantity },
        { onSuccess: () => setAdded(true), onSettled: () => setActiveAction(null) },
      );
    });
  }, [isAuthenticated, maxQuantity, mutation, productId, quantity, selectedVariant?.id, selectionRequired, unavailable]);

  const handleBuyNow = () => {
    if (activeAction || mutation.isPending || selectionRequired) return;
    setActiveAction('buy');
    mutation.mutate(
      { type: 'add', productId, variantId: selectedVariant?.id, quantity },
      { onSuccess: () => router.push(`/${locale}/checkout`), onSettled: () => setActiveAction(null) },
    );
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
        <p className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-3xl">
          {formatMoneyUzs(selectedPrice, locale)}
        </p>
        {showCompareAtPrice && (
          <>
            <del className="text-sm text-[var(--color-muted)]">{formatMoneyUzs(productCompareAtPrice!, locale)}</del>
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
          sizeValue={selectedSize}
          colorValue={selectedColor}
          label={text.choose}
          sizeLabel={text.size}
          colorLabel={text.color}
          availabilityLabel={(available) => available ? text.available : text.unavailable}
          onChange={(next, size, color) => { setVariantId(next); setSelectedSize(size); setSelectedColor(color); setQuantity(1); setAdded(false); }}
        />
      )}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-2 sm:gap-3">
        <div className="min-w-0 space-y-1.5">
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
            disabled={isLoading || mutation.isPending || activeAction !== null || unavailable || selectionRequired || quantity > maxQuantity}
            className="h-11 min-w-0 w-full whitespace-normal px-2 text-xs font-semibold sm:px-3 sm:text-sm"
          >
            <ShoppingCart size={17} className="mr-2" aria-hidden="true" />{unavailable ? text.unavailable : text.add}
          </Button>
        ) : (
          <Button type="button" onClick={() => setShowAuthModal(true)} disabled={isLoading || mutation.isPending || unavailable || selectionRequired || quantity > maxQuantity} className="h-11 min-w-0 w-full whitespace-normal px-2 text-xs font-semibold sm:px-3 sm:text-sm">
            <ShoppingCart size={17} className="mr-2 shrink-0" aria-hidden="true" />{text.add}
          </Button>
        )}
      </div>
      {(secondaryAction || (isAuthenticated && !unavailable)) && (
        <div className={`grid gap-2 ${secondaryAction && isAuthenticated && !unavailable ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {isAuthenticated && !unavailable && (
            <Button
              type="button"
              onClick={handleBuyNow}
              loading={activeAction === 'buy'}
              loadingLabel={text.buying}
              disabled={isLoading || mutation.isPending || activeAction !== null || selectionRequired || quantity > maxQuantity}
              variant="outline"
              className="min-h-11 w-full whitespace-normal px-2 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              {text.buy}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
      {added && <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{text.added} · <Link href={`/${locale}/cart`} className="underline underline-offset-2">{text.goCart}</Link></p>}
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <Modal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} title={text.authTitle}>
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">{text.authDescription}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href={`/${locale}/login?returnTo=${encodeURIComponent(safeReturnPath)}`} onClick={rememberPurchaseBeforeAuth} className="averon-primary-button flex min-h-12 items-center justify-center px-3 text-center text-sm font-semibold">{text.signIn}</Link>
          <Link href={`/${locale}/register?returnTo=${encodeURIComponent(safeReturnPath)}`} onClick={rememberPurchaseBeforeAuth} className="averon-secondary-button flex min-h-12 items-center justify-center px-3 text-center text-sm font-semibold">{text.register}</Link>
        </div>
      </Modal>
    </div>
  );
}
