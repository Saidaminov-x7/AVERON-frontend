import type { Metadata } from 'next';
import Link from 'next/link';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { externalBaseURL } from '@/lib/axios';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';

export const metadata: Metadata = { title: 'Каталог' };

async function loadCatalog(searchParams: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const key of ['q', 'category', 'minPrice', 'maxPrice', 'page']) {
    const value = searchParams[key];
    if (typeof value === 'string' && value.trim()) query.set(key, value.trim());
  }
  query.set('limit', '24');
  try {
    const response = await fetch(`${externalBaseURL}/api/v1/products?${query}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('catalog unavailable');
    return response.json();
  } catch {
    return { items: [], pagination: { total: 0, pages: 0, page: 1 } };
  }
}

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const data = await loadCatalog(filters);
  const products: StoreProduct[] = data.items ?? [];
  const categories = [['all', 'Все товары'], ['women', 'Женщинам'], ['men', 'Мужчинам'], ['shoes', 'Обувь'], ['accessories', 'Аксессуары']];
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600 dark:text-violet-400">Каталог AVERON</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Одежда, обувь и аксессуары</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500 dark:text-stone-400">Ищите по названию, категории и бюджету. Здесь показываются только товары, проверенные администратором.</p>
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900 lg:grid-cols-[1fr_180px_180px_auto]">
          <label className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} /><input name="q" defaultValue={typeof filters.q === 'string' ? filters.q : ''} placeholder="Например: чёрная куртка или белые кроссовки" className="h-12 w-full rounded-xl border border-stone-300 bg-transparent pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15 dark:border-white/15" /></label>
          <input name="minPrice" inputMode="numeric" defaultValue={typeof filters.minPrice === 'string' ? filters.minPrice : ''} placeholder="Цена от, сум" className="h-12 rounded-xl border border-stone-300 bg-transparent px-4 text-sm outline-none focus:border-violet-500 dark:border-white/15" />
          <input name="maxPrice" inputMode="numeric" defaultValue={typeof filters.maxPrice === 'string' ? filters.maxPrice : ''} placeholder="Цена до, сум" className="h-12 rounded-xl border border-stone-300 bg-transparent px-4 text-sm outline-none focus:border-violet-500 dark:border-white/15" />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white transition hover:bg-violet-700"><SlidersHorizontal size={17} /> Найти</button>
        </form>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {categories.map(([slug, title]) => { const active = slug === 'all' ? !filters.category : filters.category === slug; const href = slug === 'all' ? `/${locale}/catalog` : `/${locale}/catalog?category=${slug}`; return <Link key={slug} href={href} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-stone-300 bg-white dark:border-white/15 dark:bg-stone-900'}`}>{title}</Link>; })}
        </div>
        <div className="mt-8 flex items-center justify-between"><h2 className="text-xl font-bold">Товары <span className="text-stone-400">({data.pagination?.total ?? 0})</span></h2><div className="hidden items-center gap-2 text-sm text-stone-500 sm:flex"><Filter size={16} /> Сначала новые</div></div>
        {products.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center dark:border-white/15 dark:bg-stone-900"><Search className="mx-auto text-violet-500" size={36} /><h2 className="mt-4 text-xl font-bold">Подходящих товаров пока нет</h2><p className="mx-auto mt-2 max-w-md text-sm text-stone-500">Измените запрос или вернитесь позже: новые товары появляются после проверки администратором.</p><Link href={`/${locale}/catalog`} className="mt-5 inline-flex rounded-xl border border-stone-300 px-5 py-3 text-sm font-bold dark:border-white/15">Сбросить фильтры</Link></div>}
      </div>
    </main>
  );
}
