'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { getCommerceErrorCode } from '@/lib/commerce-orders';
import { useAuthStore } from '@/store/useAuthStore';

interface PurchaseVariant {
  id: string;
  color?: string | null;
  size?: string | null;
  stock: number;
  salePriceUzs: string | number;
}

const labels = {
  ru: { choose: 'Выберите вариант', quantity: 'Количество', add: 'Добавить в корзину', signIn: 'Войдите, чтобы добавить товар в корзину', added: 'Добавлено в корзину', goCart: 'Перейти в корзину', unavailable: 'Нет в наличии', generic: 'Не удалось добавить товар.', noStock: 'Этот товар сейчас недоступен.' },
  uz: { choose: 'Variantni tanlang', quantity: 'Miqdor', add: 'Savatchaga qo‘shish', signIn: 'Savatchaga qo‘shish uchun tizimga kiring', added: 'Savatchaga qo‘shildi', goCart: 'Savatchaga o‘tish', unavailable: 'Mavjud emas', generic: 'Mahsulotni qo‘shib bo‘lmadi.', noStock: 'Bu mahsulot hozir mavjud emas.' },
  en: { choose: 'Choose an option', quantity: 'Quantity', add: 'Add to cart', signIn: 'Sign in to add this product to your cart', added: 'Added to cart', goCart: 'View cart', unavailable: 'Out of stock', generic: 'Could not add this product.', noStock: 'This product is currently unavailable.' },
} as const;

export function AddToCart({
  productId,
  productStock,
  variants,
}: {
  productId: string;
  productStock?: number;
  variants: PurchaseVariant[];
}) {
  const locale = useLocale();
  const text = labels[locale as keyof typeof labels] ?? labels.ru;
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { mutation } = useCommerceCart();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const stock = selectedVariant?.stock ?? productStock ?? 0;
  const unavailable = stock < 1;
  const errorCode = getCommerceErrorCode(mutation.error);
  const error = mutation.isError
    ? errorCode === 'PRODUCT_NOT_AVAILABLE' || errorCode === 'INSUFFICIENT_STOCK'
      ? text.noStock
      : text.generic
    : null;

  const handleAdd = () => {
    setAdded(false);
    if (!isAuthenticated) {
      router.push(`/${locale}/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    mutation.mutate(
      {
        type: 'add',
        productId,
        variantId: selectedVariant?.id,
        quantity,
      },
      { onSuccess: () => setAdded(true) },
    );
  };

  return (
    <div className="mt-6 space-y-3">
      {variants.length > 0 && (
        <label className="block text-sm font-semibold">
          {text.choose}
          <select value={variantId} onChange={(event) => { setVariantId(event.target.value); setAdded(false); }} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-900">
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock < 1}>
                {[variant.color, variant.size].filter(Boolean).join(' · ') || '—'} · {variant.stock}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex items-end gap-3">
        <label className="block min-w-28 text-sm font-semibold">
          {text.quantity}
          <input type="number" min={1} max={Math.min(stock, 99)} step={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-900" />
        </label>
        {isAuthenticated ? (
          <button type="button" onClick={handleAdd} disabled={isLoading || mutation.isPending || unavailable || !Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(stock, 99)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 font-bold text-white transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200">
            <ShoppingCart size={17} />{unavailable ? text.unavailable : text.add}
          </button>
        ) : (
          <Link href={`/${locale}/login?redirect=${encodeURIComponent(pathname)}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-stone-300 px-4 text-center text-sm font-semibold hover:bg-stone-100 dark:border-white/15 dark:hover:bg-white/5">
            {text.signIn}
          </Link>
        )}
      </div>
      {added && <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{text.added} · <Link href={`/${locale}/cart`} className="underline underline-offset-2">{text.goCart}</Link></p>}
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    </div>
  );
}
