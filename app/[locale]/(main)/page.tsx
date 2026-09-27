import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Search, ShieldCheck, Sparkles, Zap, Headphones } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { ProductCard, type StoreProduct } from '@/components/commerce/ProductCard';
import { externalBaseURL } from '@/lib/axios';

async function getPopularListings() {
  try {
    const response = await fetch(
      `${externalBaseURL}/api/v1/products?limit=8`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || data || [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = { title: 'Главная' };

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const popularListings = await getPopularListings();
  const to = (path: string) => `/${locale}${path}`;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <main>
        <section className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-[#f1eadf] px-6 py-16 text-stone-950 shadow-[0_30px_80px_-45px_rgba(41,37,36,0.55)] dark:border-white/10 dark:bg-[#171714] dark:text-white sm:px-12 lg:px-16 lg:py-24">
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-amber-300/30 blur-3xl dark:bg-amber-500/10" />
            <div className="relative max-w-3xl">
              <span className="inline-flex rounded-full border border-stone-900/10 bg-white/55 px-3 py-1 text-xs font-semibold tracking-wide dark:border-white/15 dark:bg-white/5">AVERON · ИЗ КИТАЯ</span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">Находите вещи, которые подходят именно вам</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300 sm:text-lg">
                Одежда, обувь и аксессуары из Китая — с понятным поиском, проверенными карточками и поддержкой на каждом шаге.
              </p>
              <div className="mt-8 max-w-2xl rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">
                <SearchInput locale={locale} placeholder="Что вы хотите найти?" className="h-12 text-stone-900" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={to('/catalog')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-stone-950 px-5 text-sm font-bold text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-100">
                  Открыть каталог <ArrowRight size={16} />
                </Link>
                <Link href={to('/about')} className="inline-flex h-11 items-center rounded-xl border border-stone-900/15 px-5 text-sm font-bold transition hover:bg-white/50 dark:border-white/20 dark:hover:bg-white/10">О сервисе</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">Актуальное</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Популярные предложения</h2>
            </div>
            <Link href={to('/catalog')} className="hidden items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 sm:flex dark:text-violet-400">Смотреть все <ArrowRight size={16} /></Link>
          </div>
          {popularListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(popularListings as StoreProduct[]).slice(0, 8).map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-900">
              <Search className="mx-auto text-violet-500" size={34} />
              <h3 className="mt-4 text-lg font-bold">Предложения скоро появятся</h3>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Загляните немного позже — каталог обновляется.</p>
            </div>
          )}
        </section>

        <section className="border-y border-stone-200 bg-white dark:border-white/5 dark:bg-stone-900/60">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6 lg:px-8">
            {[
              [Sparkles, 'Простой поиск', 'Понятные фильтры помогают быстро сузить выбор.'],
              [ShieldCheck, 'Уверенный выбор', 'Вся важная информация собрана в одной карточке.'],
              [Zap, 'Быстрый доступ', 'Избранное, сравнение и история всегда под рукой.'],
            ].map(([Icon, title, text]: any) => (
              <div key={title} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Icon size={21} /></div>
                <div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-violet-600 p-8 text-white sm:p-10"><Sparkles size={28} /><h2 className="mt-6 text-3xl font-extrabold">Опишите вещь своими словами</h2><p className="mt-3 max-w-lg leading-7 text-violet-100">AI-помощник поймёт запрос, предложит точные формулировки и найдёт подходящие товары в каталоге.</p><Link href={to('/ai')} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-700">Спросить AI <ArrowRight size={16} /></Link></div>
            <div className="rounded-3xl border border-stone-200 bg-white p-8 dark:border-white/10 dark:bg-stone-900 sm:p-10"><Headphones size={28} className="text-violet-600" /><h2 className="mt-6 text-3xl font-extrabold">Поддержка отдельно от AI</h2><p className="mt-3 max-w-lg leading-7 text-stone-500 dark:text-stone-400">По вопросам оплаты, заказа и доставки отвечает команда поддержки. История обращения сохраняется в одном месте.</p><Link href={to('/support')} className="mt-7 inline-flex items-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-sm font-bold dark:border-white/15">Открыть поддержку <ArrowRight size={16} /></Link></div>
          </div>
        </section>

        <section className="bg-[#f1eadf] dark:bg-stone-900">
          <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-600">Как это работает</p><h2 className="mt-2 text-3xl font-extrabold">От поиска до получения</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{[['01', 'Выберите товар', 'Используйте категории, умный поиск или помощь AI.'], ['02', 'Подтвердите заказ', 'Проверьте вариант, размер, цену и контактные данные.'], ['03', 'Следите за доставкой', 'Получайте понятные обновления статуса заказа.']].map(([num, title, text]) => <div key={num} className="rounded-2xl bg-white p-6 dark:bg-stone-950"><span className="text-sm font-black text-violet-600">{num}</span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-stone-500">{text}</p></div>)}</div></div>
        </section>
      </main>
    </div>
  );
}
