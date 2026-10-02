'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, LoaderCircle, RefreshCw, Share2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';
import { getProduct } from '@/lib/products';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import {
  commerceQueryKeys,
  disableWishlistSharing,
  enableWishlistSharing,
  getWishlist,
  regenerateWishlistShare,
} from '@/lib/commerce-orders';

const sharingCopy = {
  ru: { title: 'Поделиться избранным', enable: 'Включить доступ по ссылке', copy: 'Скопировать ссылку', regenerate: 'Создать новую ссылку', disable: 'Отключить доступ', copied: 'Ссылка скопирована.', error: 'Не удалось обновить настройки общего доступа.' },
  uz: { title: 'Tanlanganlarni ulashish', enable: 'Havola orqali ulashishni yoqish', copy: 'Havolani nusxalash', regenerate: 'Yangi havola yaratish', disable: 'Ulashishni o‘chirish', copied: 'Havola nusxalandi.', error: 'Ulashish sozlamalarini yangilab bo‘lmadi.' },
  en: { title: 'Share your wishlist', enable: 'Enable link sharing', copy: 'Copy share link', regenerate: 'Regenerate link', disable: 'Disable sharing', copied: 'Link copied.', error: 'Could not update sharing settings.' },
} as const;

export default function FavoritesPage() {
  return <ProtectedRoute><FavoritesContent /></ProtectedRoute>;
}

function FavoritesContent() {
  const { locale = 'ru' } = useParams<{ locale: string }>();
  const text = sharingCopy[locale as keyof typeof sharingCopy] ?? sharingCopy.ru;
  const queryClient = useQueryClient();
  const ids = useFavoritesStore((state) => state.ids);
  const wishlist = useQuery({ queryKey: commerceQueryKeys.wishlist, queryFn: getWishlist });
  const serverIds = wishlist.data?.items.map((item) => item.id) ?? [];
  const allIds = [...new Set([...serverIds, ...ids])];
  const idsKey = allIds.join('|');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const sharingMutation = useMutation({
    mutationFn: enableWishlistSharing,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.wishlist }); setShareMessage(''); },
    onError: () => setShareMessage(text.error),
  });
  const regenerateMutation = useMutation({
    mutationFn: regenerateWishlistShare,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.wishlist }); setShareMessage(''); },
    onError: () => setShareMessage(text.error),
  });
  const disableMutation = useMutation({
    mutationFn: disableWishlistSharing,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: commerceQueryKeys.wishlist }); setShareMessage(''); },
    onError: () => setShareMessage(text.error),
  });

  const copyShareLink = async () => {
    const token = wishlist.data?.sharePath?.split('/').at(-1);
    if (!token) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${locale}/wishlist/shared/${token}`);
      setShareMessage(text.copied);
    } catch {
      setShareMessage(text.error);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await Promise.all(allIds.map(getProduct));
      setProducts(result.filter((item): item is StoreProduct => item !== null));
    } catch {
      setError('Не удалось загрузить избранные товары. Проверьте соединение и повторите попытку.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // load is intentionally refreshed only when the persisted selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return (
    <main className="mx-auto min-h-[60dvh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-600">AVERON</p><h1 className="mt-1 text-3xl font-bold">Избранные товары</h1></div>
        <span className="rounded-full bg-primary-500/10 px-3 py-1 text-sm font-bold text-primary-600">{products.length}</span>
      </div>
      <section aria-labelledby="wishlist-sharing-heading" className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900">
        <div className="flex items-center gap-3">
          <Share2 size={20} aria-hidden="true" />
          <h2 id="wishlist-sharing-heading" className="font-bold">{text.title}</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!wishlist.data?.sharingEnabled
            ? <button type="button" disabled={sharingMutation.isPending} onClick={() => sharingMutation.mutate()} className="min-h-10 rounded-lg bg-primary-700 px-4 font-semibold text-white disabled:opacity-50">{text.enable}</button>
            : <>
              <button type="button" onClick={() => void copyShareLink()} className="min-h-10 rounded-lg bg-primary-700 px-4 font-semibold text-white">{text.copy}</button>
              <button type="button" disabled={regenerateMutation.isPending} onClick={() => regenerateMutation.mutate()} className="min-h-10 rounded-lg border px-4 font-semibold disabled:opacity-50">{text.regenerate}</button>
              <button type="button" disabled={disableMutation.isPending} onClick={() => disableMutation.mutate()} className="min-h-10 rounded-lg border border-rose-300 px-4 font-semibold text-rose-700 disabled:opacity-50">{text.disable}</button>
            </>}
        </div>
        {shareMessage && <p role="status" className="mt-3 text-sm">{shareMessage}</p>}
        {wishlist.isError && <p role="alert" className="mt-3 text-sm text-rose-700">{text.error}</p>}
      </section>
      {loading ? <div className="flex items-center justify-center gap-3 py-24 text-stone-500"><LoaderCircle className="animate-spin" /> Загружаем товары…</div> : null}
      {!loading && error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><p>{error}</p><button onClick={() => void load()} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold text-white"><RefreshCw size={17}/>Повторить</button></div> : null}
      {!loading && !error && products.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div> : null}
      {!loading && !error && !products.length ? <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center dark:border-white/10 dark:bg-stone-900"><Heart size={44} className="mx-auto text-stone-300"/><h2 className="mt-4 text-xl font-bold">Избранное пока пусто</h2><p className="mt-2 text-sm text-stone-500">Нажимайте на сердце в карточке товара — выбранное сохранится здесь.</p><Link href={`/${locale}/catalog`} className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-600 px-5 font-semibold text-white">Открыть каталог</Link></div> : null}
    </main>
  );
}
