import type { Metadata } from 'next';
import Link from 'next/link';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { externalBaseURL } from '@/lib/axios';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';

export const metadata: Metadata = { title: 'Товары' };
type Filters = Record<string, string | string[] | undefined>;

async function loadCatalog(filters: Filters) {
  const query = new URLSearchParams();
  for (const key of ['q', 'category', 'minPrice', 'maxPrice', 'sort', 'page']) {
    const value = filters[key]; if (typeof value === 'string' && value.trim()) query.set(key, value.trim());
  }
  query.set('limit', '24');
  try {
    const response = await fetch(`${externalBaseURL}/api/v1/products?${query}`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(); return response.json();
  } catch { return { items: [], pagination: { total: 0, pages: 0, page: 1 } }; }
}

const categories = [['', 'Все товары'], ['women', 'Женщинам'], ['men', 'Мужчинам'], ['shoes', 'Обувь'], ['accessories', 'Аксессуары']];
const input = 'h-11 w-full rounded-xl border border-stone-300 bg-transparent px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-white/15';

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Filters> }) {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);
  const data = await loadCatalog(filters); const products: StoreProduct[] = data.items ?? [];
  const hasFilters = ['q', 'category', 'minPrice', 'maxPrice', 'sort'].some((key) => {
    const value = filters[key];
    return typeof value === 'string' && value.trim() !== '' && !(key === 'sort' && value === 'newest');
  });
  return <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
    <section className="border-b border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900"><div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-600">Каталог AVERON</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Товары из Китая</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Одежда, обувь и аксессуары, проверенные перед публикацией.</p></div></section>
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <form className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-stone-900 lg:hidden"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={17}/><input name="q" defaultValue={typeof filters.q === 'string' ? filters.q : ''} placeholder="Что вы хотите найти?" className={`${input} pl-10`}/></label><details className="mt-3"><summary className="flex h-11 list-none items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-bold text-white"><SlidersHorizontal size={17}/> Фильтры</summary><div className="mt-3 grid grid-cols-2 gap-3"><input name="minPrice" inputMode="numeric" defaultValue={typeof filters.minPrice === 'string' ? filters.minPrice : ''} placeholder="Цена от" className={input}/><input name="maxPrice" inputMode="numeric" defaultValue={typeof filters.maxPrice === 'string' ? filters.maxPrice : ''} placeholder="Цена до" className={input}/><button className="col-span-2 h-11 rounded-xl bg-primary-600 text-sm font-bold text-white">Применить</button></div></details></form>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block"><form className="sticky top-24 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900"><div className="flex items-center gap-2 border-b border-stone-200 pb-4 font-bold dark:border-white/10"><Filter size={18} className="text-primary-500"/> Фильтры</div><label className="mt-5 block text-xs font-bold uppercase tracking-wider text-stone-500">Поиск</label><input name="q" defaultValue={typeof filters.q === 'string' ? filters.q : ''} placeholder="Название товара" className={`${input} mt-2`}/><p className="mt-5 text-xs font-bold uppercase tracking-wider text-stone-500">Категория</p><div className="mt-2 space-y-1">{categories.map(([slug,title]) => <label key={title} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-stone-100 dark:hover:bg-white/5"><input type="radio" name="category" value={slug} defaultChecked={(filters.category ?? '') === slug} className="accent-primary-600"/>{title}</label>)}</div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-stone-500">Цена, сум</p><div className="mt-2 grid grid-cols-2 gap-2"><input name="minPrice" inputMode="numeric" defaultValue={typeof filters.minPrice === 'string' ? filters.minPrice : ''} placeholder="От" className={input}/><input name="maxPrice" inputMode="numeric" defaultValue={typeof filters.maxPrice === 'string' ? filters.maxPrice : ''} placeholder="До" className={input}/></div><label className="mt-5 block text-xs font-bold uppercase tracking-wider text-stone-500">Сортировка</label><select name="sort" defaultValue={typeof filters.sort === 'string' ? filters.sort : 'newest'} className={`${input} mt-2`}><option value="newest">Сначала новые</option><option value="price_asc">Сначала дешевле</option><option value="price_desc">Сначала дороже</option></select><button className="mt-5 h-11 w-full rounded-xl bg-primary-600 text-sm font-bold text-white">Показать товары</button><Link href={`/${locale}/catalog`} className="mt-2 flex h-10 items-center justify-center text-sm font-semibold text-stone-500">Сбросить</Link></form></aside>
        <section><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Товары <span className="text-stone-400">({data.pagination?.total ?? 0})</span></h2>{hasFilters ? <span className="text-sm text-stone-500">Результаты поиска</span> : null}</div>{products.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} locale={locale}/>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-white/15 dark:bg-stone-900"><Search className="mx-auto text-primary-500" size={36}/><h2 className="mt-4 text-xl font-bold">{hasFilters ? 'По вашему запросу ничего не найдено' : 'Каталог пока пуст'}</h2><p className="mx-auto mt-2 max-w-md text-sm text-stone-500">{hasFilters ? 'Измените запрос или параметры фильтра.' : 'Новые товары появятся здесь сразу после проверки администратором.'}</p>{hasFilters ? <Link href={`/${locale}/catalog`} className="mt-5 inline-flex rounded-xl border border-stone-300 px-5 py-3 text-sm font-bold dark:border-white/15">Сбросить фильтры</Link> : null}</div>}</section>
      </div>
    </div>
  </main>;
}
