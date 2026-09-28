'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { MessageCircle, Send } from 'lucide-react';

type FooterLink = { label: string; href: string; external?: boolean };

function FooterItem({ item, locale }: { item: FooterLink; locale: string }) {
  const className = 'text-sm text-stone-500 transition hover:text-primary-600 dark:text-stone-400 dark:hover:text-primary-300';
  if (item.external) return <a className={className} href={item.href} target="_blank" rel="noopener noreferrer">{item.label}</a>;
  return <Link className={className} href={`/${locale}${item.href}`}>{item.label}</Link>;
}

export function Footer({ locale: localeProp }: { locale?: string }) {
  const locale = useLocale() || localeProp || 'ru';
  const columns: { title: string; links: FooterLink[] }[] = [
    { title: 'Покупателям', links: [
      { label: 'Все товары', href: '/catalog' }, { label: 'Избранное', href: '/favorites' },
      { label: 'Сравнение', href: '/compare' }, { label: 'Как заказать', href: '/how-to-order' },
    ] },
    { title: 'Помощь', links: [
      { label: 'AI-помощник', href: '/ai' },
      { label: 'Написать поддержке', href: 'https://t.me/averon_fashion_admin', external: true },
      { label: 'Вопросы и ответы', href: '/faq' }, { label: 'О компании', href: '/about' },
    ] },
    { title: 'Документы', links: [
      { label: 'Пользовательское соглашение', href: '/terms' },
      { label: 'Политика конфиденциальности', href: '/privacy' },
      { label: 'Публичная оферта', href: '/public-offer' },
      { label: 'Доставка и оплата', href: '/delivery' }, { label: 'Возврат товара', href: '/returns' },
    ] },
  ];

  return (
    <footer className="w-full border-t border-stone-200 bg-white dark:border-white/10 dark:bg-stone-900">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_repeat(3,1fr)]">
          <div>
            <Link href={`/${locale}`} className="text-xl font-black tracking-[.18em] text-stone-950 dark:text-white">AVERON</Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-stone-500 dark:text-stone-400">Товары из Китая с понятным выбором, ручной проверкой карточек и доставкой по Узбекистану.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href="https://t.me/averon_fashion" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold dark:border-white/10"><Send size={15}/> Наш канал</a>
              <a href="https://t.me/averon_fashion_admin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm font-semibold dark:border-white/10"><MessageCircle size={15}/> Поддержка</a>
            </div>
          </div>
          {columns.map((column) => <div key={column.title}><h2 className="mb-4 text-xs font-bold uppercase tracking-[.14em]">{column.title}</h2><ul className="space-y-3">{column.links.map((item) => <li key={item.href}><FooterItem item={item} locale={locale}/></li>)}</ul></div>)}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-stone-200 pt-6 text-xs text-stone-400 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AVERON. Все права защищены.</p>
          <p>Сервис работает для покупателей в Республике Узбекистан.</p>
        </div>
      </div>
    </footer>
  );
}
