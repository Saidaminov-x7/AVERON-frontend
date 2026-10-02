import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function TermsPage() {
  const t = await getTranslations('Terms');

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-stone-200 dark:border-stone-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          {t('lastUpdated')}
        </p>
      </div>

      <p className="max-w-3xl leading-7 text-stone-600 dark:text-stone-300">
        {t('contentPending')}
      </p>
    </div>
  );
}