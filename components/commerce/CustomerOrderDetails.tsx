'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { commerceQueryKeys, getCustomerOrder } from '@/lib/commerce-orders';

const copy = {
  ru: { title: 'Заказ', success: 'Заказ оформлен', successText: 'Номер заказа и итоговая сумма подтверждены сервером.', loading: 'Загружаем заказ…', error: 'Заказ не найден или у вас нет к нему доступа.', retry: 'Повторить', list: 'Мои заказы', number: 'Номер заказа', status: 'Статус', items: 'Товары', subtotal: 'Товары', discount: 'Скидка', delivery: 'Доставка', total: 'Итого', notPaid: 'Онлайн-оплата не выполнялась. Менеджер свяжется с вами для подтверждения заказа.' },
  uz: { title: 'Buyurtma', success: 'Buyurtma rasmiylashtirildi', successText: 'Buyurtma raqami va yakuniy summa server tomonidan tasdiqlandi.', loading: 'Buyurtma yuklanmoqda…', error: 'Buyurtma topilmadi yoki unga kirish huquqingiz yo‘q.', retry: 'Qayta urinish', list: 'Buyurtmalarim', number: 'Buyurtma raqami', status: 'Holati', items: 'Mahsulotlar', subtotal: 'Mahsulotlar', discount: 'Chegirma', delivery: 'Yetkazib berish', total: 'Jami', notPaid: 'Onlayn to‘lov amalga oshirilmadi. Menejer buyurtmani tasdiqlash uchun bog‘lanadi.' },
  en: { title: 'Order', success: 'Order placed', successText: 'The server confirmed your order number and final total.', loading: 'Loading order…', error: 'Order not found or you do not have access to it.', retry: 'Try again', list: 'My orders', number: 'Order number', status: 'Status', items: 'Items', subtotal: 'Items', discount: 'Discount', delivery: 'Delivery', total: 'Total', notPaid: 'No online payment was made. A manager will contact you to confirm the order.' },
} as const;

const statusCopy = {
  CREATED: { ru: 'Создан', uz: 'Yaratildi', en: 'Created' },
  CONFIRMED: { ru: 'Подтверждён', uz: 'Tasdiqlandi', en: 'Confirmed' },
  CANCELLED: { ru: 'Отменён', uz: 'Bekor qilindi', en: 'Cancelled' },
  PAID: { ru: 'Оплачен', uz: 'To‘langan', en: 'Paid' },
  DELIVERED: { ru: 'Доставлен', uz: 'Yetkazildi', en: 'Delivered' },
} as const;

function formatUzs(amount: string, locale: string) {
  const value = Number(amount);
  return `${Number.isFinite(value) ? value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}`;
}

function OrderDetailsContent({ success }: { success: boolean }) {
  const locale = useLocale() as 'ru' | 'uz' | 'en';
  const text = copy[locale] ?? copy.ru;
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber);
  const query = useQuery({
    queryKey: commerceQueryKeys.order(orderNumber),
    queryFn: () => getCustomerOrder(orderNumber),
    staleTime: 10_000,
    retry: false,
  });

  return (
    <main className="min-h-[65vh] bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href={`/${locale}/orders`} className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-primary-700">
          <ArrowLeft size={16} />{text.list}
        </Link>
        {query.isLoading ? (
          <p role="status" className="mt-8">{text.loading}</p>
        ) : query.isError ? (
          <div role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <p>{text.error}</p>
            <button type="button" onClick={() => void query.refetch()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-current px-4 font-semibold">
              <RefreshCw size={16} />{text.retry}
            </button>
          </div>
        ) : query.data ? (
          <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
            {success && <div className="mb-6 flex gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 shrink-0" /><div><h1 className="font-bold">{text.success}</h1><p className="mt-1 text-sm">{text.successText}</p></div></div>}
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="text-2xl font-extrabold">{text.title} #{query.data.orderNumber}</h1>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold dark:bg-white/10">{statusCopy[query.data.status as keyof typeof statusCopy]?.[locale] ?? query.data.status}</span>
            </div>
            <p className="mt-2 text-sm text-stone-500">{text.number}: {query.data.orderNumber}</p>
            <h2 className="mt-7 font-bold">{text.items}</h2>
            <ul className="mt-3 divide-y divide-stone-200 dark:divide-white/10">
              {query.data.items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex justify-between gap-4 py-3 text-sm">
                  <span>{item.title}{item.variantSnapshot && [item.variantSnapshot.color, item.variantSnapshot.size].filter(Boolean).length ? ` · ${[item.variantSnapshot.color, item.variantSnapshot.size].filter(Boolean).join(' · ')}` : ''} × {item.quantity}</span>
                  <span className="shrink-0 font-semibold">{formatUzs(item.totalPrice, locale)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm dark:border-white/10">
              <div className="flex justify-between gap-3"><dt>{text.subtotal}</dt><dd>{formatUzs(query.data.subtotal, locale)}</dd></div>
              {Number(query.data.discount) > 0 && <div className="flex justify-between gap-3"><dt>{text.discount}</dt><dd>-{formatUzs(query.data.discount, locale)}</dd></div>}
              <div className="flex justify-between gap-3"><dt>{text.delivery}</dt><dd>{formatUzs(query.data.deliveryCost, locale)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-3 text-base font-extrabold dark:border-white/10"><dt>{text.total}</dt><dd>{formatUzs(query.data.totalRevenue, locale)}</dd></div>
            </dl>
            <p className="mt-5 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-950 dark:text-stone-300">{text.notPaid}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export function CustomerOrderDetails({ success = false }: { success?: boolean }) {
  return <ProtectedRoute><OrderDetailsContent success={success} /></ProtectedRoute>;
}
