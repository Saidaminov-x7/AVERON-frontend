'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Minus, Plus, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProductImage } from '@/components/commerce/ProductImage';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { getCommerceErrorCode } from '@/lib/commerce-orders';

const copy = {
  ru: {
    title: 'Корзина', loading: 'Загружаем корзину…', empty: 'В корзине пока пусто',
    emptyText: 'Выберите товары из каталога — они появятся здесь после добавления.',
    catalog: 'Перейти в каталог', subtotal: 'Итого', checkout: 'Перейти к оформлению',
    remove: 'Удалить товар', clear: 'Очистить корзину', retry: 'Повторить',
    unavailable: 'Товар больше недоступен для покупки. Удалите его из корзины.',
    stock: 'Доступно сейчас', quantity: 'Количество', failed: 'Не удалось обновить корзину.',
    errors: {
      PRODUCT_NOT_AVAILABLE: 'Товар больше недоступен для покупки.',
      INSUFFICIENT_STOCK: 'На складе недостаточно товара для этого количества.',
      INVALID_QUANTITY: 'Укажите допустимое количество.',
      CART_NOT_FOUND: 'Корзина не найдена. Обновите страницу.',
    },
  },
  uz: {
    title: 'Savatcha', loading: 'Savatcha yuklanmoqda…', empty: 'Savatcha hozircha bo‘sh',
    emptyText: 'Katalogdan mahsulotlarni tanlang — qo‘shilgandan so‘ng ular shu yerda ko‘rinadi.',
    catalog: 'Katalogga o‘tish', subtotal: 'Jami', checkout: 'Rasmiylashtirish',
    remove: 'Mahsulotni olib tashlash', clear: 'Savatchani tozalash', retry: 'Qayta urinish',
    unavailable: 'Mahsulot endi xarid uchun mavjud emas. Uni savatchadan olib tashlang.',
    stock: 'Hozir mavjud', quantity: 'Miqdor', failed: 'Savatchani yangilab bo‘lmadi.',
    errors: {
      PRODUCT_NOT_AVAILABLE: 'Mahsulot endi xarid uchun mavjud emas.',
      INSUFFICIENT_STOCK: 'Omborda bu miqdor uchun mahsulot yetarli emas.',
      INVALID_QUANTITY: 'Ruxsat etilgan miqdorni kiriting.',
      CART_NOT_FOUND: 'Savatcha topilmadi. Sahifani yangilang.',
    },
  },
  en: {
    title: 'Your cart', loading: 'Loading your cart…', empty: 'Your cart is empty',
    emptyText: 'Choose products from the catalog and they will appear here.',
    catalog: 'Browse catalog', subtotal: 'Subtotal', checkout: 'Continue to checkout',
    remove: 'Remove item', clear: 'Clear cart', retry: 'Try again',
    unavailable: 'This product is no longer available. Remove it from your cart.',
    stock: 'Available now', quantity: 'Quantity', failed: 'Could not update your cart.',
    errors: {
      PRODUCT_NOT_AVAILABLE: 'This product is no longer available.',
      INSUFFICIENT_STOCK: 'There is not enough stock for that quantity.',
      INVALID_QUANTITY: 'Enter a valid quantity.',
      CART_NOT_FOUND: 'Cart not found. Refresh the page.',
    },
  },
} as const;

function formatUzs(amount: string | number, locale: string) {
  const number = Number(amount);
  return `${Number.isFinite(number) ? number.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}`;
}

function CartContent() {
  const locale = useLocale();
  const text = copy[locale as keyof typeof copy] ?? copy.ru;
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, mutation, isMutating } = useCommerceCart();
  const [retrying, setRetrying] = useState(false);
  const errorCode = getCommerceErrorCode(error) ?? getCommerceErrorCode(mutation.error);
  const errorMessage = (errorCode && errorCode in text.errors)
    ? text.errors[errorCode as keyof typeof text.errors]
    : text.failed;
  const items = data?.items ?? [];
  const hasUnavailable = items.some((item) => !item.available);

  const changeQuantity = (itemId: string, quantity: number) => {
    mutation.mutate({ type: 'update', itemId, quantity });
  };

  return (
    <main className="min-h-[65vh] bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">{text.title}</h1>

        {isLoading ? (
          <div role="status" className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-stone-500 dark:border-white/10 dark:bg-stone-900">
            {text.loading}
          </div>
        ) : isError ? (
          <div role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <p>{errorMessage}</p>
            <button type="button" disabled={retrying} onClick={async () => { setRetrying(true); try { await refetch(); } finally { setRetrying(false); } }} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-current px-4 font-semibold disabled:opacity-50">
              <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />{text.retry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-stone-900">
            <ShoppingBag className="mx-auto text-stone-400" size={36} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">{text.empty}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{text.emptyText}</p>
            <Link href={`/${locale}/catalog`} className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary-700 px-5 font-bold text-white hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
              {text.catalog}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section aria-label={text.title} className="space-y-3">
              {mutation.isError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{errorMessage}</p>
              )}
              {items.map((item) => (
                <article key={item.id} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
                    <ProductImage src={item.imageUrl ?? undefined} alt={item.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold leading-5">{item.title}</h2>
                    {(item.variant?.color || item.variant?.size) && (
                      <p className="mt-1 text-sm text-stone-500">
                        {[item.variant.color, item.variant.size].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{formatUzs(item.unitPriceUzs, locale)}</p>
                    {!item.available && <p role="status" className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">{text.unavailable}</p>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex h-10 items-center rounded-xl border border-stone-200 dark:border-white/15">
                        <button type="button" aria-label={`${text.quantity}: ${item.quantity}, decrease`} disabled={isMutating || !item.available || item.quantity <= 1} onClick={() => changeQuantity(item.id, item.quantity - 1)} className="grid h-10 w-10 place-items-center rounded-l-xl hover:bg-stone-50 disabled:opacity-40 dark:hover:bg-white/5">
                          <Minus size={15} />
                        </button>
                        <span aria-label={text.quantity} className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" aria-label={`${text.quantity}: ${item.quantity}, increase`} disabled={isMutating || !item.available || item.quantity >= Math.min(item.stock, 99)} onClick={() => changeQuantity(item.id, item.quantity + 1)} className="grid h-10 w-10 place-items-center rounded-r-xl hover:bg-stone-50 disabled:opacity-40 dark:hover:bg-white/5">
                          <Plus size={15} />
                        </button>
                      </div>
                      <p className="font-bold">{formatUzs(item.lineTotalUzs, locale)}</p>
                      <button type="button" aria-label={`${text.remove}: ${item.title}`} disabled={isMutating} onClick={() => mutation.mutate({ type: 'remove', itemId: item.id })} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/30">
                        <Trash2 size={16} />{text.remove}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <h2 className="text-lg font-bold">{text.subtotal}</h2>
              <p className="mt-3 flex justify-between gap-4 text-lg font-extrabold">
                <span>{text.subtotal}</span><span>{formatUzs(data?.subtotalUzs ?? 0, locale)}</span>
              </p>
              {hasUnavailable && <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{text.unavailable}</p>}
              <button type="button" disabled={isMutating || hasUnavailable} onClick={() => router.push(`/${locale}/checkout`)} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 font-bold text-white hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50">
                {text.checkout}<ArrowRight size={17} />
              </button>
              <button type="button" disabled={isMutating} onClick={() => mutation.mutate({ type: 'clear' })} className="mt-3 h-10 w-full rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 disabled:opacity-50 dark:hover:bg-white/5">
                {text.clear}
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CartPage() {
  return <ProtectedRoute><CartContent /></ProtectedRoute>;
}
