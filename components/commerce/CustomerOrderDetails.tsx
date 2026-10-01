'use client';

import { useLocale } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { cancelCustomerOrder, commerceQueryKeys, getCustomerOrder } from '@/lib/commerce-orders';

const copy = {
  ru: { title: 'Заказ', success: 'Заказ оформлен', successText: 'Номер заказа и итоговая сумма подтверждены сервером.', loading: 'Загружаем заказ…', error: 'Заказ не найден или у вас нет к нему доступа.', retry: 'Повторить', list: 'Мои заказы', number: 'Номер заказа', status: 'Статус', progress: 'История заказа', created: 'Заказ создан', createdOn: 'Создан', note: 'Комментарий', shipments: 'Отправления', provider: 'Перевозчик', trackingNumber: 'Трек-номер', shipmentStatus: 'Статус отправления', sentOn: 'Отправлено', arrivedOn: 'Прибыло', items: 'Товары', subtotal: 'Товары', discount: 'Скидка', delivery: 'Доставка', total: 'Итого', notPaid: 'Онлайн-оплата не выполнялась. Менеджер свяжется с вами для подтверждения заказа.', preorder: 'Предзаказ', preorderDate: 'Ожидаемая доступность', cancel: 'Отменить заказ', confirmCancel: 'Да, отменить', keepOrder: 'Оставить заказ', cancelPrompt: 'Отменить можно только новый заказ. После отмены товар вернётся в доступный остаток.', cancelError: 'Не удалось отменить заказ. Возможно, его уже начали обрабатывать.' },
  uz: { title: 'Buyurtma', success: 'Buyurtma rasmiylashtirildi', successText: 'Buyurtma raqami va yakuniy summa server tomonidan tasdiqlandi.', loading: 'Buyurtma yuklanmoqda…', error: 'Buyurtma topilmadi yoki unga kirish huquqingiz yo‘q.', retry: 'Qayta urinish', list: 'Buyurtmalarim', number: 'Buyurtma raqami', status: 'Holati', progress: 'Buyurtma tarixi', created: 'Buyurtma yaratildi', createdOn: 'Yaratilgan', note: 'Izoh', shipments: 'Jo‘natmalar', provider: 'Tashuvchi', trackingNumber: 'Kuzatuv raqami', shipmentStatus: 'Jo‘natma holati', sentOn: 'Jo‘natildi', arrivedOn: 'Yetib keldi', items: 'Mahsulotlar', subtotal: 'Mahsulotlar', discount: 'Chegirma', delivery: 'Yetkazib berish', total: 'Jami', notPaid: 'Onlayn to‘lov amalga oshirilmadi. Menejer buyurtmani tasdiqlash uchun bog‘lanadi.', preorder: 'Oldindan buyurtma', preorderDate: 'Kutilayotgan mavjudlik', cancel: 'Buyurtmani bekor qilish', confirmCancel: 'Ha, bekor qilish', keepOrder: 'Buyurtmani qoldirish', cancelPrompt: 'Faqat yangi buyurtmani bekor qilish mumkin. Bekor qilingach, mahsulot zaxiraga qaytariladi.', cancelError: 'Buyurtmani bekor qilib bo‘lmadi. U allaqachon qayta ishlanayotgan bo‘lishi mumkin.' },
  en: { title: 'Order', success: 'Order placed', successText: 'The server confirmed your order number and final total.', loading: 'Loading order…', error: 'Order not found or you do not have access to it.', retry: 'Try again', list: 'My orders', number: 'Order number', status: 'Status', progress: 'Order history', created: 'Order created', createdOn: 'Created', note: 'Note', shipments: 'Shipments', provider: 'Provider', trackingNumber: 'Tracking number', shipmentStatus: 'Shipment status', sentOn: 'Sent', arrivedOn: 'Arrived', items: 'Items', subtotal: 'Items', discount: 'Discount', delivery: 'Delivery', total: 'Total', notPaid: 'No online payment was made. A manager will contact you to confirm the order.', preorder: 'Preorder', preorderDate: 'Estimated availability', cancel: 'Cancel order', confirmCancel: 'Yes, cancel', keepOrder: 'Keep order', cancelPrompt: 'Only a new order can be cancelled. Cancelled stock will be returned to available inventory.', cancelError: 'Could not cancel this order. It may already be processing.' },
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

const deliveryCopy = {
  ru: { title: 'Доставка', method: 'Способ доставки', courier: 'Курьер', pickup: 'Самовывоз', tracking: 'Трек-номер', provider: 'Перевозчик', estimate: 'Ожидаемая доставка' },
  uz: { title: 'Yetkazib berish', method: 'Yetkazib berish usuli', courier: 'Kuryer', pickup: 'Olib ketish', tracking: 'Kuzatuv raqami', provider: 'Tashuvchi', estimate: 'Kutilayotgan yetkazib berish' },
  en: { title: 'Delivery', method: 'Delivery method', courier: 'Courier', pickup: 'Pickup', tracking: 'Tracking number', provider: 'Provider', estimate: 'Estimated delivery' },
} as const;

const deliveryStatusCopy: Record<string, Record<'ru' | 'uz' | 'en', string>> = {
  PENDING: { ru: 'Ожидает подготовки', uz: 'Tayyorlanmoqda', en: 'Pending preparation' },
  PREPARING: { ru: 'Подготовка', uz: 'Tayyorlanmoqda', en: 'Preparing' },
  SHIPPED: { ru: 'Отправлен', uz: 'Jo‘natildi', en: 'Shipped' },
  IN_TRANSIT: { ru: 'В пути', uz: 'Yo‘lda', en: 'In transit' },
  READY_FOR_DELIVERY: { ru: 'Готов к доставке', uz: 'Yetkazishga tayyor', en: 'Ready for delivery' },
  DELIVERED: { ru: 'Доставлен', uz: 'Yetkazildi', en: 'Delivered' },
  CANCELLED: { ru: 'Отменена', uz: 'Bekor qilindi', en: 'Cancelled' },
};

function statusLabel(status: string, locale: 'ru' | 'uz' | 'en') {
  return statusCopy[status]?.[locale] ?? status;
}

function formatOrderDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU');
}

function formatUzs(amount: string | number, locale: string) {
  const value = Number(amount);
  return `${Number.isFinite(value) ? value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'uz' ? 'uz-UZ' : 'ru-RU') : '0'} ${locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}`;
}

function OrderDetailsContent({ success }: { success: boolean }) {
  const locale = useLocale() as 'ru' | 'uz' | 'en';
  const text = copy[locale] ?? copy.ru;
  const deliveryText = deliveryCopy[locale];
  const queryClient = useQueryClient();
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber);
  const query = useQuery({
    queryKey: commerceQueryKeys.order(orderNumber),
    queryFn: () => getCustomerOrder(orderNumber),
    staleTime: 10_000,
    retry: false,
  });
  const cancellation = useMutation({
    mutationFn: () => cancelCustomerOrder(orderNumber),
    onSuccess: async (order) => {
      queryClient.setQueryData(commerceQueryKeys.order(orderNumber), order);
      await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.orders });
      setConfirmCancellation(false);
    },
  });
  const historyEvents = query.data?.statusHistory?.length
    ? [...query.data.statusHistory].sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return (Number.isFinite(leftTime) ? leftTime : 0) - (Number.isFinite(rightTime) ? rightTime : 0);
    })
    : query.data
      ? [
        { status: 'CREATED', createdAt: query.data.createdAt },
        ...(query.data.status === 'CREATED' ? [] : [{ status: query.data.status, createdAt: '' }]),
      ]
      : [];

  return (
    <main className="min-h-[65vh] bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <SmartBackButton fallbackHref={`/${locale}/orders`} />
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
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold dark:bg-white/10">{statusLabel(query.data.status, locale)}</span>
            </div>
            <p className="mt-2 text-sm text-stone-500">{text.number}: {query.data.orderNumber}</p>
            <section className="mt-7 rounded-xl border border-stone-200 p-4 dark:border-white/10" aria-label={text.progress}>
              <h2 className="font-bold">{text.progress}</h2>
              <ol className="mt-4 space-y-4">
                {historyEvents.map((event, index) => {
                  const formattedDate = event.createdAt ? formatOrderDateTime(event.createdAt, locale) : null;
                  const isCurrent = event.status === query.data.status && index === historyEvents.length - 1;
                  return (
                    <li key={`${event.status}-${event.createdAt}-${index}`} aria-current={isCurrent ? 'step' : undefined} className="flex items-start gap-3">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${isCurrent ? 'bg-emerald-700 text-white' : 'border border-stone-300 text-stone-400 dark:border-stone-600'}`}>
                        {isCurrent ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}
                      </span>
                      <div>
                        <p className={`text-sm ${isCurrent ? 'font-bold' : 'font-medium text-stone-600 dark:text-stone-300'}`}>{statusLabel(event.status, locale)}</p>
                        {formattedDate && <p className="mt-1 text-xs text-stone-500">{text.createdOn}: <time dateTime={event.createdAt}>{formattedDate}</time></p>}
                        {event.note && <p className="mt-1 text-xs text-stone-500">{text.note}: {event.note}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
            {query.data.delivery && (
              <section className="mt-5 rounded-xl border border-stone-200 p-4 dark:border-white/10" aria-label={deliveryText.title}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold">{deliveryText.title}</h2>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-900 dark:bg-sky-950/60 dark:text-sky-100">
                    {deliveryStatusCopy[query.data.delivery.status]?.[locale] ?? query.data.delivery.status}
                  </span>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-stone-500">{deliveryText.method}</dt><dd>{query.data.delivery.method === 'PICKUP' ? deliveryText.pickup : deliveryText.courier}</dd></div>
                  {query.data.delivery.provider && <div><dt className="text-xs text-stone-500">{deliveryText.provider}</dt><dd>{query.data.delivery.provider}</dd></div>}
                  {query.data.delivery.trackingNumber && <div className="min-w-0"><dt className="text-xs text-stone-500">{deliveryText.tracking}</dt><dd className="break-all font-mono">{query.data.delivery.trackingNumber}</dd></div>}
                  {query.data.delivery.estimatedDeliveryAt && formatOrderDateTime(query.data.delivery.estimatedDeliveryAt, locale) && (
                    <div><dt className="text-xs text-stone-500">{deliveryText.estimate}</dt><dd><time dateTime={query.data.delivery.estimatedDeliveryAt}>{formatOrderDateTime(query.data.delivery.estimatedDeliveryAt, locale)}</time></dd></div>
                  )}
                </dl>
                {query.data.delivery.history.length > 0 && (
                  <ol className="mt-4 space-y-3 border-l-2 border-stone-200 pl-4 dark:border-stone-700">
                    {query.data.delivery.history.map((event, index) => (
                      <li key={`${event.status}-${event.createdAt}-${index}`} className="relative text-sm">
                        <span className="font-semibold">{deliveryStatusCopy[event.status]?.[locale] ?? event.status}</span>
                        <time className="ml-2 text-xs text-stone-500" dateTime={event.createdAt}>{formatOrderDateTime(event.createdAt, locale)}</time>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
            {(query.data.shipments?.length ?? 0) > 0 && (
              <section className="mt-5 rounded-xl border border-stone-200 p-4 dark:border-white/10" aria-label={text.shipments}>
                <h2 className="font-bold">{text.shipments}</h2>
                <ul className="mt-3 space-y-4">
                  {query.data.shipments!.map((shipment, index) => (
                    <li key={`${shipment.trackingNumber}-${index}`} className="space-y-1 text-sm">
                      {shipment.provider && <p>{text.provider}: <span className="font-medium">{shipment.provider}</span></p>}
                      {shipment.trackingNumber && <p>{text.trackingNumber}: <span className="font-mono font-medium">{shipment.trackingNumber}</span></p>}
                      {shipment.status && <p>{text.shipmentStatus}: <span className="font-medium">{shipment.status}</span></p>}
                      {shipment.sentAt && formatOrderDateTime(shipment.sentAt, locale) && <p>{text.sentOn}: <time dateTime={shipment.sentAt}>{formatOrderDateTime(shipment.sentAt, locale)}</time></p>}
                      {shipment.arrivedAt && formatOrderDateTime(shipment.arrivedAt, locale) && <p>{text.arrivedOn}: <time dateTime={shipment.arrivedAt}>{formatOrderDateTime(shipment.arrivedAt, locale)}</time></p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <h2 className="mt-7 font-bold">{text.items}</h2>
            <ul className="mt-3 divide-y divide-stone-200 dark:divide-white/10">
              {query.data.items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex justify-between gap-4 py-3 text-sm">
                  <span>
                    {item.title}{item.variantSnapshot && [item.variantSnapshot.color, item.variantSnapshot.size].filter(Boolean).length ? ` · ${[item.variantSnapshot.color, item.variantSnapshot.size].filter(Boolean).join(' · ')}` : ''} × {item.quantity}
                    {item.isPreorder && <span className="ml-2 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">{text.preorder}</span>}
                    {item.isPreorder && item.estimatedAvailableAt && formatOrderDateTime(item.estimatedAvailableAt, locale) && (
                      <span className="mt-1 block text-xs text-stone-500">{text.preorderDate}: {formatOrderDateTime(item.estimatedAvailableAt, locale)}</span>
                    )}
                  </span>
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
            {(query.data.status === 'CREATED' || query.data.status === 'CONFIRMED') && (
              <p className="mt-5 rounded-xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-stone-950 dark:text-stone-300">{text.notPaid}</p>
            )}
            {query.data.status === 'CREATED' && (
              <div className="mt-5 border-t border-stone-200 pt-4 dark:border-white/10">
                {confirmCancellation ? (
                  <div className="space-y-3" role="group" aria-label={text.cancel}>
                    <p className="text-sm text-stone-600 dark:text-stone-300">{text.cancelPrompt}</p>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" disabled={cancellation.isPending} onClick={() => cancellation.mutate()} className="min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50">
                        {cancellation.isPending ? '…' : text.confirmCancel}
                      </button>
                      <button type="button" disabled={cancellation.isPending} onClick={() => setConfirmCancellation(false)} className="min-h-10 rounded-xl border border-stone-300 px-4 text-sm font-semibold hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5">
                        {text.keepOrder}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmCancellation(true)} className="min-h-10 rounded-xl border border-rose-300 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30">
                    {text.cancel}
                  </button>
                )}
                {cancellation.isError && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{text.cancelError}</p>}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export function CustomerOrderDetails({ success = false }: { success?: boolean }) {
  return <ProtectedRoute><OrderDetailsContent success={success} /></ProtectedRoute>;
}
