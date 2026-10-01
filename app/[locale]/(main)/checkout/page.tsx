'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useCommerceCart } from '@/hooks/useCommerceCart';
import { createCheckout, commerceQueryKeys, getCommerceErrorCode } from '@/lib/commerce-orders';
import { useAuthStore } from '@/store/useAuthStore';

const copy = {
  ru: {
    title: 'Оформление заказа', contact: 'Контактные данные', name: 'Имя и фамилия', phone: 'Телефон',
    delivery: 'Адрес доставки', city: 'Город', address: 'Улица, дом', apartment: 'Квартира / офис (необязательно)',
    entrance: 'Подъезд (необязательно)', floor: 'Этаж (необязательно)', comment: 'Комментарий курьеру (необязательно)',
    total: 'Итого по корзине', submit: 'Подтвердить заказ', back: 'Вернуться в корзину',
    loading: 'Загружаем корзину…', empty: 'Корзина пуста или содержит недоступные товары.', retry: 'Повторить',
    payment: 'Это оформление заказа, а не онлайн-оплата. Оплата не производится на сайте; менеджер свяжется с вами для подтверждения.',
    fail: 'Не удалось оформить заказ. Проверьте данные и попробуйте ещё раз.',
    errors: {
      CART_EMPTY: 'Корзина пуста.',
      PRODUCT_NOT_AVAILABLE: 'Один из товаров больше недоступен. Вернитесь в корзину.',
      VARIANT_NOT_AVAILABLE: 'Выбранный вариант больше недоступен. Проверьте корзину.',
      INSUFFICIENT_STOCK: 'Количество товара изменилось. Проверьте корзину.',
      CHECKOUT_CONFLICT: 'Корзина изменилась во время оформления. Проверьте её и повторите попытку.',
      IDEMPOTENCY_CONFLICT: 'Этот ключ уже использован для другого запроса. Измените данные и попробуйте снова.',
      INVALID_QUANTITY: 'В корзине указано недопустимое количество.',
      INVALID_CHECKOUT_DETAILS: 'Проверьте контактные данные и адрес доставки.',
      INVALID_PRICE: 'Не удалось подтвердить цену товара. Обновите корзину.',
    },
  },
  uz: {
    title: 'Buyurtmani rasmiylashtirish', contact: 'Aloqa ma’lumotlari', name: 'Ism va familiya', phone: 'Telefon',
    delivery: 'Yetkazib berish manzili', city: 'Shahar', address: 'Ko‘cha, uy', apartment: 'Kvartira / ofis (ixtiyoriy)',
    entrance: 'Kirish yo‘lagi (ixtiyoriy)', floor: 'Qavat (ixtiyoriy)', comment: 'Kuryerga izoh (ixtiyoriy)',
    total: 'Savatcha jami', submit: 'Buyurtmani tasdiqlash', back: 'Savatchaga qaytish',
    loading: 'Savatcha yuklanmoqda…', empty: 'Savatcha bo‘sh yoki xarid uchun mavjud bo‘lmagan mahsulotlar bor.', retry: 'Qayta urinish',
    payment: 'Bu buyurtmani rasmiylashtirish, onlayn to‘lov emas. Saytda to‘lov amalga oshirilmaydi; menejer tasdiqlash uchun siz bilan bog‘lanadi.',
    fail: 'Buyurtmani rasmiylashtirib bo‘lmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.',
    errors: {
      CART_EMPTY: 'Savatcha bo‘sh.',
      PRODUCT_NOT_AVAILABLE: 'Mahsulotlardan biri endi mavjud emas. Savatchaga qayting.',
      VARIANT_NOT_AVAILABLE: 'Tanlangan variant endi mavjud emas. Savatchani tekshiring.',
      INSUFFICIENT_STOCK: 'Mahsulot miqdori o‘zgardi. Savatchani tekshiring.',
      CHECKOUT_CONFLICT: 'Rasmiylashtirish vaqtida savatcha o‘zgardi. Tekshirib, qayta urinib ko‘ring.',
      IDEMPOTENCY_CONFLICT: 'Ushbu kalit boshqa so‘rov uchun ishlatilgan. Ma’lumotlarni o‘zgartirib, qayta urinib ko‘ring.',
      INVALID_QUANTITY: 'Savatchadagi miqdor noto‘g‘ri.',
      INVALID_CHECKOUT_DETAILS: 'Aloqa ma’lumotlari va yetkazib berish manzilini tekshiring.',
      INVALID_PRICE: 'Mahsulot narxini tasdiqlab bo‘lmadi. Savatchani yangilang.',
    },
  },
  en: {
    title: 'Checkout', contact: 'Contact details', name: 'Full name', phone: 'Phone',
    delivery: 'Delivery address', city: 'City', address: 'Street and building',
    apartment: 'Apartment / office (optional)', entrance: 'Entrance (optional)', floor: 'Floor (optional)',
    comment: 'Delivery note (optional)', total: 'Cart total', submit: 'Place order', back: 'Back to cart',
    loading: 'Loading your cart…', empty: 'Your cart is empty or contains unavailable products.', retry: 'Try again',
    payment: 'This creates an order; it is not an online payment. No payment is taken on this site. A manager will contact you to confirm.',
    fail: 'Could not place the order. Check your details and try again.',
    errors: {
      CART_EMPTY: 'Your cart is empty.',
      PRODUCT_NOT_AVAILABLE: 'A product is no longer available. Return to your cart.',
      VARIANT_NOT_AVAILABLE: 'The selected option is no longer available. Review your cart.',
      INSUFFICIENT_STOCK: 'Stock changed. Please check your cart.',
      CHECKOUT_CONFLICT: 'Your cart changed during checkout. Review it and try again.',
      IDEMPOTENCY_CONFLICT: 'This key was already used for a different request. Update your details and retry.',
      INVALID_QUANTITY: 'The cart contains an invalid quantity.',
      INVALID_CHECKOUT_DETAILS: 'Check your contact details and delivery address.',
      INVALID_PRICE: 'The product price could not be confirmed. Refresh your cart.',
    },
  },
} as const;

function formatUzs(amount: string | number, locale: string) {
  const value = Number(amount);
  return `${Number.isFinite(value) ? value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}`;
}

function CheckoutContent() {
  const locale = useLocale();
  const text = copy[locale as keyof typeof copy] ?? copy.ru;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: cart, isLoading: isCartLoading, isError: isCartError, refetch } = useCommerceCart();
  const [contact, setContact] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [deliveryAddress, setDeliveryAddress] = useState({ city: '', address: '', apartment: '', entrance: '', floor: '', comment: '' });
  const idempotencyKey = useRef<string | null>(null);

  const checkout = useMutation({
    mutationFn: createCheckout,
    onSuccess: async (order) => {
      queryClient.setQueryData(commerceQueryKeys.order(order.orderNumber), order);
      await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.cart });
      router.push(`/${locale}/checkout/success/${encodeURIComponent(order.orderNumber)}`);
    },
  });

  const changeDetails = <K extends 'contact' | 'deliveryAddress'>(
    group: K,
    field: keyof (K extends 'contact' ? typeof contact : typeof deliveryAddress),
    value: string,
  ) => {
    idempotencyKey.current = null;
    if (group === 'contact') {
      setContact((current) => ({ ...current, [field]: value }));
    } else {
      setDeliveryAddress((current) => ({ ...current, [field]: value }));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    checkout.mutate({
      contact: { name: contact.name.trim(), phone: contact.phone.trim() },
      deliveryAddress: {
        city: deliveryAddress.city.trim(),
        address: deliveryAddress.address.trim(),
        ...(deliveryAddress.apartment.trim() ? { apartment: deliveryAddress.apartment.trim() } : {}),
        ...(deliveryAddress.entrance.trim() ? { entrance: deliveryAddress.entrance.trim() } : {}),
        ...(deliveryAddress.floor.trim() ? { floor: deliveryAddress.floor.trim() } : {}),
        ...(deliveryAddress.comment.trim() ? { comment: deliveryAddress.comment.trim() } : {}),
      },
      idempotencyKey: idempotencyKey.current,
    });
  };

  const errorCode = getCommerceErrorCode(checkout.error);
  const errorMessage = errorCode && errorCode in text.errors
    ? text.errors[errorCode as keyof typeof text.errors]
    : text.fail;
  const isCartEligible = Boolean(cart?.items.length) && cart?.items.every((item) => item.available);

  return (
    <main className="min-h-[65vh] bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href={`/${locale}/cart`} className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-primary-700">
          <ArrowLeft size={16} />{text.back}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold">{text.title}</h1>

        {isCartLoading ? <p role="status" className="mt-8">{text.loading}</p> : isCartError ? (
          <div role="alert" className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <p>{text.fail}</p><button type="button" onClick={() => void refetch()} className="mt-3 inline-flex items-center gap-2 underline"><RefreshCw size={15} />{text.retry}</button>
          </div>
        ) : !isCartEligible ? (
          <div role="alert" className="mt-8 rounded-xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
            <p>{text.empty}</p><Link href={`/${locale}/cart`} className="mt-3 inline-block font-semibold text-primary-700 dark:text-primary-300">{text.back}</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
                <legend className="px-1 text-lg font-bold">{text.contact}</legend>
                <label className="block text-sm font-medium">{text.name}
                  <input required minLength={2} maxLength={100} autoComplete="name" value={contact.name} onChange={(event) => changeDetails('contact', 'name', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-950" />
                </label>
                <label className="block text-sm font-medium">{text.phone}
                  <input required minLength={7} maxLength={30} autoComplete="tel" inputMode="tel" value={contact.phone} onChange={(event) => changeDetails('contact', 'phone', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-950" />
                </label>
              </fieldset>
              <fieldset className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
                <legend className="px-1 text-lg font-bold">{text.delivery}</legend>
                <label className="block text-sm font-medium">{text.city}
                  <input required minLength={2} maxLength={100} autoComplete="address-level2" value={deliveryAddress.city} onChange={(event) => changeDetails('deliveryAddress', 'city', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-950" />
                </label>
                <label className="block text-sm font-medium">{text.address}
                  <input required minLength={4} maxLength={300} autoComplete="street-address" value={deliveryAddress.address} onChange={(event) => changeDetails('deliveryAddress', 'address', event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-950" />
                </label>
                {([
                  ['apartment', text.apartment, 'address-line2'],
                  ['entrance', text.entrance, ''],
                  ['floor', text.floor, ''],
                  ['comment', text.comment, ''],
                ] as const).map(([key, label, autocomplete]) => (
                  <label key={key} className="block text-sm font-medium">{label}
                    <input maxLength={key === 'comment' ? 500 : 50} autoComplete={autocomplete || undefined} value={deliveryAddress[key]} onChange={(event) => changeDetails('deliveryAddress', key, event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 dark:border-white/15 dark:bg-stone-950" />
                  </label>
                ))}
              </fieldset>
            </div>
            <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
              <h2 className="text-lg font-bold">{text.total}</h2>
              <p className="mt-3 text-2xl font-extrabold">{formatUzs(cart?.subtotalUzs ?? 0, locale)}</p>
              <p className="mt-4 text-xs leading-5 text-stone-500">{text.payment}</p>
              {checkout.isError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">{errorMessage}</p>}
              <button type="submit" disabled={checkout.isPending || !isCartEligible} className="mt-5 h-12 w-full rounded-xl bg-primary-700 px-4 font-bold text-white hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50">
                {checkout.isPending ? '…' : text.submit}
              </button>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return <ProtectedRoute><CheckoutContent /></ProtectedRoute>;
}
