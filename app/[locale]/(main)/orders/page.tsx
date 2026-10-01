'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, PackageCheck, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { commerceQueryKeys, getCustomerOrders } from '@/lib/commerce-orders';

const copy = {
  ru: { title: 'Мои заказы', empty: 'У вас пока нет заказов', emptyText: 'Оформленные заказы появятся здесь.', shop: 'Перейти в каталог', retry: 'Повторить', error: 'Не удалось загрузить заказы.', total: 'Сумма', status: 'Статус', date: 'Дата', open: 'Подробнее' },
  uz: { title: 'Buyurtmalarim', empty: 'Sizda hali buyurtmalar yo‘q', emptyText: 'Rasmiylashtirilgan buyurtmalar shu yerda ko‘rinadi.', shop: 'Katalogga o‘tish', retry: 'Qayta urinish', error: 'Buyurtmalarni yuklab bo‘lmadi.', total: 'Summa', status: 'Holati', date: 'Sana', open: 'Batafsil' },
  en: { title: 'My orders', empty: 'You have no orders yet', emptyText: 'Your placed orders will appear here.', shop: 'Browse catalog', retry: 'Try again', error: 'Could not load your orders.', total: 'Total', status: 'Status', date: 'Date', open: 'View details' },
} as const;

const statusCopy: Record<string, Record<'ru' | 'uz' | 'en', string>> = {
  CREATED: { ru: 'Создан', uz: 'Yaratildi', en: 'Created' },
  CONFIRMED: { ru: 'Подтверждён', uz: 'Tasdiqlandi', en: 'Confirmed' },
  PAID: { ru: 'Оплачен', uz: 'To‘langan', en: 'Paid' },
  ORDERED_FROM_SUPPLIER: { ru: 'Заказан у поставщика', uz: 'Yetkazib beruvchidan buyurtma qilindi', en: 'Ordered from supplier' },
  SUPPLIER_CONFIRMED: { ru: 'Подтверждён поставщиком', uz: 'Yetkazib beruvchi tasdiqladi', en: 'Supplier confirmed' },
  IN_TRANSIT_CHINA: { ru: 'В пути по Китаю', uz: 'Xitoy bo‘ylab yo‘lda', en: 'In transit in China' },
  CARGO_WAREHOUSE: { ru: 'На складе карго', uz: 'Kargo omborida', en: 'At cargo warehouse' },
  INTERNATIONAL_TRANSIT: { ru: 'Международная перевозка', uz: 'Xalqaro tashuvda', en: 'International transit' },
  ARRIVED_UZBEKISTAN: { ru: 'Прибыл в Узбекистан', uz: 'O‘zbekistonga yetib keldi', en: 'Arrived in Uzbekistan' },
  OUT_FOR_DELIVERY: { ru: 'Передан в доставку', uz: 'Yetkazib berishga topshirildi', en: 'Out for delivery' },
  DELIVERED: { ru: 'Доставлен', uz: 'Yetkazildi', en: 'Delivered' },
  COMPLETED: { ru: 'Завершён', uz: 'Yakunlandi', en: 'Completed' },
  CANCELLED: { ru: 'Отменён', uz: 'Bekor qilindi', en: 'Cancelled' },
};

function formatUzs(amount: string | number, locale: string) {
  const value = Number(amount);
  return `${Number.isFinite(value) ? value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}`;
}

function OrdersContent() {
  const locale = useLocale() as 'ru' | 'uz' | 'en';
  const text = copy[locale] ?? copy.ru;
  const query = useQuery({
    queryKey: commerceQueryKeys.orders,
    queryFn: getCustomerOrders,
    staleTime: 30_000,
  });

  return (
    <main className="min-h-[65vh] bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold">{text.title}</h1>
        {query.isLoading ? (
          <div role="status" className="mt-8 h-40 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        ) : query.isError ? (
          <div role="alert" className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
            <p>{text.error}</p>
            <button type="button" onClick={() => void query.refetch()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-current px-4 font-semibold">
              <RefreshCw size={16} />{text.retry}
            </button>
          </div>
        ) : !query.data?.length ? (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-stone-900">
            <PackageCheck className="mx-auto text-stone-400" size={36} aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold">{text.empty}</h2>
            <p className="mt-2 text-sm text-stone-500">{text.emptyText}</p>
            <Link href={`/${locale}/catalog`} className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-700 px-5 font-bold text-white hover:bg-primary-800">{text.shop}</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {query.data.map((order) => {
              const status = statusCopy[order.status as keyof typeof statusCopy];
              return (
                <article key={order.orderNumber} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
                  <div>
                    <h2 className="font-bold">#{order.orderNumber}</h2>
                    <p className="mt-1 text-sm text-stone-500">{new Date(order.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU')} · {order.items.length} {locale === 'en' ? 'items' : locale === 'uz' ? 'mahsulot' : 'тов.'}</p>
                    <p className="mt-2 text-sm">{text.status}: <span className="font-semibold">{status?.[locale] ?? order.status}</span></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{formatUzs(order.totalRevenue, locale)}</p>
                    <Link href={`/${locale}/orders/${encodeURIComponent(order.orderNumber)}`} aria-label={`${text.open}: ${order.orderNumber}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-300 px-3 text-sm font-semibold hover:bg-stone-50 dark:border-white/15 dark:hover:bg-white/5">
                      {text.open}<ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return <ProtectedRoute><OrdersContent /></ProtectedRoute>;
}
