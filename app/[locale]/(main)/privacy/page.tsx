import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Privacy' });
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy');

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-line dark:border-line pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink dark:text-white tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-ink-soft">
          {t('lastUpdated')}
        </p>
      </div>

      <p className="max-w-3xl leading-7 text-muted dark:text-ink-soft">
        {t('contentPending')}
      </p>
    </div>
  );
}