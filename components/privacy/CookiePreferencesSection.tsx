'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CookieSettingsLink } from './CookieSettingsLink';
import { readOptionalConsent, subscribeToConsentChanges } from '@/lib/consent';

export function CookiePreferencesSection() {
  const t = useTranslations('profile.privacy');
  const [analytics, setAnalytics] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setAnalytics(readOptionalConsent()?.analytics ?? null);
    update();
    return subscribeToConsentChanges(update);
  }, []);

  return (
    <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-stone-900" aria-labelledby="cookie-preferences-title">
      <h2 id="cookie-preferences-title" className="font-bold">{t('title')}</h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t('description')}</p>
      <p className="mt-3 text-sm" role="status">
        {analytics === null ? t('notChosen') : analytics ? t('analyticsOn') : t('analyticsOff')}
      </p>
      <CookieSettingsLink label={t('manage')} />
    </section>
  );
}
