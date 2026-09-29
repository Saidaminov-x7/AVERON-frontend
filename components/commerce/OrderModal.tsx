'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, ShoppingBag, X } from 'lucide-react';
import api from '@/lib/axios';
import { type StoreProduct, productTitle } from '@/lib/products';
import { useAuthStore } from '@/store/useAuthStore';

interface OrderModalProps {
  product: StoreProduct & {
    variants?: Array<{
      id: string;
      color?: string | null;
      size?: string | null;
      stock?: number;
      salePriceUzs?: string | number;
    }>;
  };
  locale: string;
}

export function OrderModal({ product, locale }: OrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [note, setNote] = useState('');

  const title = productTitle(product, locale);
  const price = Number(product.salePriceUzs || 0).toLocaleString(
    locale === 'en' ? 'en-US' : 'ru-RU'
  );
  const currency = locale === 'en' ? 'UZS' : locale === 'uz' ? "so'm" : 'сум';

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);

  const handleOpen = () => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!phone) setPhone(user.phone || '');
    }
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(
        locale === 'uz'
          ? 'Ism va telefon raqamingizni kiriting'
          : locale === 'en'
          ? 'Please enter your name and phone'
          : 'Пожалуйста, укажите имя и телефон'
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const sourceUrl =
        product.sourceUrl ||
        (typeof window !== 'undefined'
          ? window.location.href
          : `https://averon.uz/catalog/${product.slug}`);

      await api.post('/api/v1/custom-orders', {
        source: (product.source as any) || 'SOURCE_1688',
        sourceUrl,
        quantity,
        selectedVariant: selectedVariant
          ? {
              id: selectedVariant.id,
              color: selectedVariant.color,
              size: selectedVariant.size,
            }
          : undefined,
        contact: {
          name: name.trim(),
          phone: phone.trim(),
          note: note.trim() || undefined,
        },
      });

      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as any)?.response?.data?.message ||
        (locale === 'uz'
          ? 'Buyurtma yuborishda xatolik yuz berdi'
          : locale === 'en'
          ? 'Failed to submit order request'
          : 'Не удалось отправить заявку. Попробуйте позже.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 font-bold text-white transition-[transform,background-color] duration-200 ease-out active:scale-[0.98] hover:bg-violet-700 cursor-pointer shadow-sm hover:shadow"
      >
        <ShoppingBag size={18} />
        {locale === 'uz' ? 'Buyurtma berish' : locale === 'en' ? 'Place Order' : 'Оформить заказ'}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Закрыть"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors"
            >
              <X size={20} />
            </button>

            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {locale === 'uz'
                    ? 'Buyurtma qabul qilindi!'
                    : locale === 'en'
                    ? 'Order Submitted!'
                    : 'Заявка принята!'}
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 max-w-sm mx-auto">
                  {locale === 'uz'
                    ? 'Menejerimiz tez orada siz bilan bog‘lanadi va buyurtma tafsilotlarini aniqlashtiradi.'
                    : locale === 'en'
                    ? 'Our manager will contact you shortly to confirm the order details.'
                    : 'Наш менеджер свяжется с вами в ближайшее время для подтверждения деталей заказа.'}
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full h-11 rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-700 transition-colors"
                  >
                    {locale === 'uz' ? 'Yaxshi' : locale === 'en' ? 'Got it' : 'Понятно'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    {locale === 'uz'
                      ? 'Buyurtma rasmiylashtirish'
                      : locale === 'en'
                      ? 'Checkout Request'
                      : 'Заявка на заказ товара'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">{title}</p>
                  <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                    {price} {currency}
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    {error}
                  </div>
                )}

                {product.variants && product.variants.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      {locale === 'uz' ? 'Variant' : locale === 'en' ? 'Variant' : 'Вариант'}
                    </label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    >
                      {product.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {[v.color, v.size].filter(Boolean).join(' · ') || 'Стандартный'}
                          {v.stock ? ` (${v.stock} шт.)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      {locale === 'uz' ? 'Soni' : locale === 'en' ? 'Quantity' : 'Количество'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      {locale === 'uz' ? 'Telefon raqam' : locale === 'en' ? 'Phone' : 'Телефон'} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+998 90 123 45 67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    {locale === 'uz' ? 'Ismingiz' : locale === 'en' ? 'Your Name' : 'Ваше имя'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Иван"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    {locale === 'uz' ? 'Izoh' : locale === 'en' ? 'Note' : 'Комментарий к заказу'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      locale === 'uz'
                        ? 'Yetkazib berish manzili yoki qo‘shimcha ma’lumot'
                        : locale === 'en'
                        ? 'Delivery address or special requests'
                        : 'Адрес доставки или пожелания'
                    }
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-violet-600 font-bold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {locale === 'uz' ? 'Yuborilmoqda...' : locale === 'en' ? 'Sending...' : 'Отправка...'}
                      </>
                    ) : (
                      locale === 'uz' ? 'Buyurtmani tasdiqlash' : locale === 'en' ? 'Confirm Order' : 'Отправить заявку'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
