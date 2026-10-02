import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'infoPages.publicOffer' });
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default function PublicOfferPage() {
  const t = useTranslations('infoPages.publicOffer');

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-white">
      <article className="mx-auto w-full max-w-[1000px] px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-600">{t('eyebrow')}</p>
        <h1 className="mt-3 text-4xl font-extrabold">{t('title')}</h1>
        <div className="mt-8 space-y-6 rounded-2xl border border-stone-200 bg-white p-6 leading-7 text-stone-600 dark:border-white/10 dark:bg-stone-900 dark:text-stone-300 sm:p-8">
          <section>
            <h2 className="text-xl font-bold text-stone-950 dark:text-white">{t('sections.0.title')}</h2>
            <p className="mt-2">{t('sections.0.text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-stone-950 dark:text-white">{t('sections.1.title')}</h2>
            <p className="mt-2">{t('sections.1.text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-stone-950 dark:text-white">{t('sections.2.title')}</h2>
            <p className="mt-2">{t('sections.2.text')}</p>
          </section>
          <p className="text-sm">{t('footer')}</p>
        </div>
      </article>
    </main>
  );
}
