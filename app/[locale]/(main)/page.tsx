import Link from 'next/link';
import { ArrowRight, Search, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { ApartmentCard } from './catalog/components/ApartmentCard';
import { externalBaseURL } from '@/lib/axios';

async function getPopularListings() {
  try {
    const response = await fetch(
      `${externalBaseURL}/listings?status=ACTIVE&sortBy=viewsCount&sortOrder=desc&limit=6`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || data || [];
  } catch {
    return [];
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const popularListings = await getPopularListings();
  const to = (path: string) => `/${locale}${path}`;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <main>
        <section className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-700 via-indigo-700 to-slate-900 px-6 py-16 text-white shadow-xl sm:px-12 lg:px-16 lg:py-24">
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <div className="relative max-w-3xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">AVERON</span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">Найдите подходящий вариант быстрее</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-violet-100 sm:text-lg">
                Удобный поиск, понятные карточки и всё необходимое для уверенного выбора в одном сервисе.
              </p>
              <div className="mt-8 max-w-2xl rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">
                <SearchInput locale={locale} placeholder="Что вы хотите найти?" className="h-12 text-stone-900" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={to('/catalog')} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-violet-800 transition hover:bg-violet-50">
                  Открыть каталог <ArrowRight size={16} />
                </Link>
                <Link href={to('/about')} className="inline-flex h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-bold transition hover:bg-white/10">О сервисе</Link>
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
              {popularListings.slice(0, 6).map((listing: any) => <ApartmentCard key={listing.id} apartment={listing} locale={locale} />)}
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
      </main>
    </div>
  );
}
