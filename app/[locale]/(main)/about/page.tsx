import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, PackageCheck, Search, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'О нас' };

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const steps = [
    [Search, 'Находим', 'Собираем одежду, обувь и аксессуары от поставщиков из Китая.'],
    [ShieldCheck, 'Проверяем', 'Каждый товар проходит ручную модерацию перед публикацией.'],
    [PackageCheck, 'Доставляем', 'Сопровождаем заказ до получения в Узбекистане.'],
  ];
  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="rounded-3xl border border-stone-200 bg-[#f1eadf] px-6 py-14 dark:border-white/10 dark:bg-stone-900 sm:px-12 lg:px-16">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600 dark:text-violet-400">О компании</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">AVERON помогает выбирать вещи уверенно</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">Мы делаем заказ товаров из Китая понятным: структурируем карточки, проверяем информацию вручную и остаёмся рядом, когда нужна поддержка.</p>
        </div>
      </section>
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">{steps.map(([Icon, title, text]: any) => <article key={title} className="rounded-2xl border border-stone-200 bg-white p-7 dark:border-white/10 dark:bg-stone-900"><div className="flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Icon size={21} /></div><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{text}</p></article>)}</div>
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600">Наш принцип</p><h2 className="mt-3 text-3xl font-extrabold">AI помогает, человек принимает решение</h2><p className="mt-4 leading-7 text-stone-600 dark:text-stone-300">Технологии ускоряют перевод, поиск и подготовку характеристик. Но публикацию товара всегда подтверждает администратор. Так каталог остаётся аккуратным и честным.</p></div>
          <ul className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">{['Понятные цены в сумах', 'Ручная проверка карточек', 'Поддержка по заказу', 'Прозрачные статусы доставки'].map((item) => <li key={item} className="flex items-center gap-3 text-sm font-semibold"><CheckCircle2 size={19} className="text-violet-600" />{item}</li>)}</ul>
        </div>
        <div className="mt-14 rounded-2xl bg-stone-950 p-8 text-white dark:bg-white dark:text-stone-950 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-2xl font-bold">Готовы найти нужную вещь?</h2><p className="mt-2 text-sm opacity-70">Откройте каталог или спросите AI-помощника.</p></div><div className="mt-5 flex gap-3 sm:mt-0"><Link href={`/${locale}/catalog`} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white">Каталог</Link><Link href={`/${locale}/ai`} className="rounded-xl border border-current px-5 py-3 text-sm font-bold">AI-помощник</Link></div></div>
      </section>
    </main>
  );
}
