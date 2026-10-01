import { useTranslations } from 'next-intl';
import { Headphones, Mail, MessageCircle, PackageSearch } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = {
    ru: 'Поддержка',
    uz: 'Yordam',
    en: 'Support',
  };
  return { title: titles[locale] || 'Support' };
}

export default function SupportPage() {
  const t = useTranslations('infoPages.support');

  const cardIcons = [PackageSearch, MessageCircle, Headphones];

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-primary-700">{t('eyebrow')}</p>
        <h1 className="mt-3 text-4xl font-extrabold">{t('title')}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-500">{t('description')}</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((idx) => {
            const Icon = cardIcons[idx];
            return (
              <article key={idx} className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
                <Icon className="text-primary-700" />
                <h2 className="mt-4 font-bold">{t(`cards.${idx}.title`)}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">{t(`cards.${idx}.text`)}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-stone-900">
          <h2 className="text-xl font-bold">{t('formTitle')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <input
              placeholder={t('namePlaceholder')}
              className="h-12 rounded-xl border border-stone-300 bg-transparent px-4 outline-none focus:border-primary-600 dark:border-white/15"
            />
            <input
              placeholder={t('phonePlaceholder')}
              className="h-12 rounded-xl border border-stone-300 bg-transparent px-4 outline-none focus:border-primary-600 dark:border-white/15"
            />
            <input
              placeholder={t('orderPlaceholder')}
              className="h-12 rounded-xl border border-stone-300 bg-transparent px-4 outline-none focus:border-primary-600 dark:border-white/15 sm:col-span-2"
            />
            <textarea
              placeholder={t('messagePlaceholder')}
              rows={5}
              className="rounded-xl border border-stone-300 bg-transparent p-4 outline-none focus:border-primary-600 dark:border-white/15 sm:col-span-2"
            />
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-700 px-6 font-bold text-white transition-colors hover:bg-primary-800 sm:w-fit">
              <Mail size={18} /> {t('submitButton')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
