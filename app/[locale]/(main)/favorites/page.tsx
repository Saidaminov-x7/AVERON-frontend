'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, LoaderCircle, RefreshCw } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';
import { getProduct } from '@/lib/products';
import { useFavoritesStore } from '@/store/useFavoritesStore';

export default function FavoritesPage() {
  return <ProtectedRoute><FavoritesContent /></ProtectedRoute>;
}

function FavoritesContent() {
  const { locale = 'ru' } = useParams<{ locale: string }>();
  const ids = useFavoritesStore((state) => state.ids);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const idsKey = ids.join('|');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await Promise.all(ids.map(getProduct));
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
      {loading ? <div className="flex items-center justify-center gap-3 py-24 text-stone-500"><LoaderCircle className="animate-spin" /> Загружаем товары…</div> : null}
      {!loading && error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><p>{error}</p><button onClick={() => void load()} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 font-semibold text-white"><RefreshCw size={17}/>Повторить</button></div> : null}
      {!loading && !error && products.length ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div> : null}
      {!loading && !error && !products.length ? <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center dark:border-white/10 dark:bg-stone-900"><Heart size={44} className="mx-auto text-stone-300"/><h2 className="mt-4 text-xl font-bold">Избранное пока пусто</h2><p className="mt-2 text-sm text-stone-500">Нажимайте на сердце в карточке товара — выбранное сохранится здесь.</p><Link href={`/${locale}/catalog`} className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary-600 px-5 font-semibold text-white">Открыть каталог</Link></div> : null}
    </main>
  );
}
