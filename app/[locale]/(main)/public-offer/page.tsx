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
    <main className="min-h-screen bg-surface-soft text-ink dark:bg-surface-soft dark:text-white">
      <article className="mx-auto w-full max-w-[1000px] px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-600">{t('eyebrow')}</p>
        <h1 className="mt-3 text-4xl font-extrabold">{t('title')}</h1>
        <div className="mt-8 space-y-6 rounded-2xl border border-line bg-white p-6 leading-7 text-muted dark:border-white/10 dark:bg-surface-soft dark:text-ink-soft sm:p-8">
          <section>
            <h2 className="text-xl font-bold text-ink dark:text-white">{t('sections.0.title')}</h2>
            <p className="mt-2">{t('sections.0.text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink dark:text-white">{t('sections.1.title')}</h2>
            <p className="mt-2">{t('sections.1.text')}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-ink dark:text-white">{t('sections.2.title')}</h2>
            <p className="mt-2">{t('sections.2.text')}</p>
          </section>
          <p className="text-sm">{t('footer')}</p>
        </div>
      </article>
    </main>
  );
}
