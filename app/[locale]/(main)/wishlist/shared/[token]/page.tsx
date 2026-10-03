'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getSharedWishlist } from '@/lib/commerce-orders';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';
import { ProductImage } from '@/components/commerce/ProductImage';

const copy = {
  ru: { title: 'Избранное', loading: 'Загрузка списка…', unavailable: 'Список недоступен или доступ отключён.', empty: 'В этом списке пока нет доступных товаров.', view: 'Посмотреть товар', available: 'В наличии', unavailableProduct: 'Сейчас недоступен' },
  uz: { title: 'Tanlanganlar', loading: 'Ro‘yxat yuklanmoqda…', unavailable: 'Ro‘yxat mavjud emas yoki ulashish o‘chirilgan.', empty: 'Ro‘yxatda hozircha mavjud mahsulotlar yo‘q.', view: 'Mahsulotni ko‘rish', available: 'Mavjud', unavailableProduct: 'Hozir mavjud emas' },
  en: { title: 'Wishlist', loading: 'Loading wishlist…', unavailable: 'This wishlist is unavailable or sharing has been disabled.', empty: 'There are no eligible products in this wishlist yet.', view: 'View product', available: 'Available', unavailableProduct: 'Currently unavailable' },
} as const;

export default function SharedWishlistPage() {
  const { locale = 'ru', token } = useParams<{ locale: string; token: string }>();
  const text = copy[locale as keyof typeof copy] ?? copy.ru;
  useEffect(() => {
    if (locale === 'ru' || locale === 'uz' || locale === 'en') {
      trackCommerceEvent({ eventName: 'wishlist_share_open' }, `/${locale}/wishlist/shared`);
    }
  }, [locale]);
  const wishlist = useQuery({
    queryKey: ['commerce', 'shared-wishlist', token],
    queryFn: () => getSharedWishlist(token),
    retry: false,
  });

  return (
    <main className="mx-auto min-h-[60dvh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">{text.title}</h1>
      {wishlist.isPending && <p role="status">{text.loading}</p>}
      {wishlist.isError && <p role="alert" className="rounded-xl border border-stone-200 p-6">{text.unavailable}</p>}
      {wishlist.data && wishlist.data.items.length === 0 && <p>{text.empty}</p>}
      {wishlist.data && wishlist.data.items.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.data.items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
              <div className="aspect-[4/5] w-full"><ProductImage src={item.imageUrl ?? undefined} alt={item.title} /></div>
              <div className="p-4">
                <h2 className="line-clamp-2 font-semibold">{item.title}</h2>
                <p className="mt-2 font-bold">{Number(item.priceUzs).toLocaleString(locale)} {locale === 'en' ? 'UZS' : locale === 'uz' ? 'so‘m' : 'сум'}</p>
                <p className="mt-1 text-sm">{item.available ? text.available : text.unavailableProduct}</p>
                <Link href={`/${locale}/catalog/${encodeURIComponent(item.slug)}`} className="mt-3 inline-flex min-h-10 items-center font-semibold text-primary-700 underline underline-offset-4">
                  {text.view}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
