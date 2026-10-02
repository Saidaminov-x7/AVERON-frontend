'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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

const labels = {
  ru: {
    choose: 'Выберите вариант', quantity: 'Количество', decrease: 'Уменьшить количество', increase: 'Увеличить количество',
    add: 'Добавить в корзину', buy: 'Купить сейчас', adding: 'Добавляем…', buying: 'Оформляем…', signIn: 'Войдите, чтобы добавить товар в корзину', added: 'Добавлено в корзину',
    goCart: 'Перейти в корзину', unavailable: 'Нет в наличии', available: 'Доступен для заказа',
    stock: 'В наличии: {count}', lowStock: 'Заканчивается: {count} шт.', generic: 'Не удалось добавить товар.', noStock: 'Этот товар сейчас недоступен.',
    standard: 'Стандартный', currency: 'сум', preorder: 'Предзаказ', preorderDate: 'Ожидаемая доступность: {date}',
  },
  uz: {
    choose: 'Variantni tanlang', quantity: 'Miqdor', decrease: 'Miqdorni kamaytirish', increase: 'Miqdorni oshirish',
    add: 'Savatchaga qo‘shish', buy: 'Hozir xarid qilish', adding: 'Qo‘shilmoqda…', buying: 'Rasmiylashtirilmoqda…', signIn: 'Savatchaga qo‘shish uchun tizimga kiring', added: 'Savatchaga qo‘shildi',
    goCart: 'Savatchaga o‘tish', unavailable: 'Mavjud emas', available: 'Buyurtma berish mumkin',
    stock: 'Mavjud: {count}', lowStock: 'Kam qoldi: {count} dona.', generic: 'Mahsulotni qo‘shib bo‘lmadi.', noStock: 'Bu mahsulot hozir mavjud emas.',
    standard: 'Standart', currency: 'so‘m', preorder: 'Oldindan buyurtma', preorderDate: 'Kutilayotgan mavjudlik: {date}',
  },
  en: {
    choose: 'Choose an option', quantity: 'Quantity', decrease: 'Decrease quantity', increase: 'Increase quantity',
    add: 'Add to cart', buy: 'Buy now', adding: 'Adding…', buying: 'Processing…', signIn: 'Sign in to add this product to your cart', added: 'Added to cart',
    goCart: 'View cart', unavailable: 'Out of stock', available: 'Available to order',
    stock: 'In stock: {count}', lowStock: 'Low stock: {count} left.', generic: 'Could not add this product.', noStock: 'This product is currently unavailable.',
    standard: 'Standard', currency: 'UZS', preorder: 'Preorder', preorderDate: 'Estimated availability: {date}',
  },
} as const;

function formatUzs(amount: string | number, locale: string, currency: string) {
  const value = Number(amount);
  const formatted = Number.isFinite(value)
    ? value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')
    : '0';
  return `${formatted} ${currency}`;
}

export function AddToCart({
  productId,
  productPrice,
  productStock,
  productAvailable,
  productAvailability,
  variants,
}: {
  productId: string;
  productPrice: string | number;
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
  const [variantId, setVariantId] = useState(
    () => (variants.find((variant) => !isVariantUnavailable(variant.available, variant.stock)) ?? variants[0])?.id ?? '',
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeAction, setActiveAction] = useState<'add' | 'buy' | null>(null);
  const { isAuthenticated, isLoading } = useAuthStore();
  const { mutation } = useCommerceCart();
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const availability = selectedVariant?.available ?? productAvailable;
  const stock = selectedVariant?.stock ?? productStock;
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
  const lowStock = !unavailable && stockIsKnown && stock! > 0 && stock! <= 5;
  const selectedPrice = selectedVariant?.salePriceUzs ?? productPrice;
  const selectedName = selectedVariant
    ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' · ') || text.standard
    : '';
  const estimatedDate = productAvailability?.estimatedAvailableAt
    ? new Date(productAvailability.estimatedAvailableAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')
    : null;
  const stockStatus = unavailable
    ? text.unavailable
    : isPreorder
      ? `${text.preorder}${estimatedDate ? ` · ${text.preorderDate.replace('{date}', estimatedDate)}` : ''}`
      : lowStock
      ? text.lowStock.replace('{count}', String(stock))
    : stockIsKnown && stock! > 0
      ? text.stock.replace('{count}', String(stock))
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
    if (activeAction || mutation.isPending) return;
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
    if (activeAction || mutation.isPending) return;
    setActiveAction('buy');
    mutation.mutate(
      { type: 'add', productId, variantId: selectedVariant?.id, quantity },
      { onSuccess: () => router.push(`/${locale}/checkout`), onSettled: () => setActiveAction(null) },
    );
  };

  return (
    <div className="mt-6 space-y-3">
      <p className="text-2xl font-black" aria-live="polite">
        {formatUzs(selectedPrice, locale, text.currency)}
      </p>
      {selectedName && <p className="text-sm text-stone-600 dark:text-stone-300">{selectedName}</p>}
      {stockStatus && (
        <p
          role={unavailable ? 'status' : undefined}
          className={unavailable ? 'text-sm font-semibold text-rose-700 dark:text-rose-300' : 'text-sm text-stone-600 dark:text-stone-300'}
        >
          {stockStatus}
        </p>
      )}
      {variants.length > 0 && (
        <ProductVariantSelector
          variants={variants}
          value={variantId}
          label={text.choose}
          standardLabel={text.standard}
          stockLabel={text.stock}
          availabilityLabel={(available) => available ? text.available : text.unavailable}
          onChange={(next) => { setVariantId(next); setQuantity(1); setAdded(false); }}
        />
      )}
      <div className="flex flex-wrap items-end gap-3">
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
            disabled={!isAuthenticated || isLoading || mutation.isPending || activeAction !== null || unavailable || quantity > maxQuantity}
            className="h-11 min-w-48 flex-1 rounded-xl bg-stone-900 px-4 font-bold text-white hover:bg-stone-700 focus-visible:ring-stone-500 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200"
          >
            <ShoppingCart size={17} className="mr-2" aria-hidden="true" />{unavailable ? text.unavailable : text.add}
          </Button>
        ) : (
          <Link
            href={`/${locale}/login?returnTo=${encodeURIComponent(getSafeInternalReturnTo(`${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`, locale) ?? `/${locale}/catalog`)}`}
            className="inline-flex min-h-11 min-w-48 flex-1 items-center justify-center rounded-xl border border-stone-300 px-4 text-center text-sm font-semibold hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:border-white/15 dark:hover:bg-white/5"
          >
            {text.signIn}
          </Link>
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
          className="min-h-10 rounded-xl px-4 text-sm font-semibold focus-visible:ring-stone-500"
        >
          {text.buy}
        </Button>
      )}
      {added && <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{text.added} · <Link href={`/${locale}/cart`} className="underline underline-offset-2">{text.goCart}</Link></p>}
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    </div>
  );
}
