import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function InfoPage({
  eyebrow,
  title,
  description,
  items,
  locale,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: Array<{ title: string; text: string }>;
  locale: string;
}) {
  const t = useTranslations('infoPages');

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-700">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-stone-500">{description}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
              <CheckCircle2 className="text-primary-700" size={22} />
              <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">{item.text}</p>
            </article>
          ))}
        </div>
        <Link
          href={`/${locale}/catalog`}
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-800"
        >
          {t('backToCatalog')} <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
