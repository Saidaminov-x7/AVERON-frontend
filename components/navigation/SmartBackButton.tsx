'use client';

import { ArrowLeft } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getAuthHomeHref, getSafeInternalReferrer, getSafeInternalReturnTo, isAuthPathname } from '@/lib/safe-navigation';

const labels = {
  ru: 'Назад',
  uz: 'Orqaga',
  en: 'Back',
} as const;

export function SmartBackButton({ fallbackHref }: { fallbackHref: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fallback = getSafeInternalReturnTo(fallbackHref, locale) ?? `/${locale}/catalog`;

  const goBack = () => {
    if (isAuthPathname(pathname, locale)) {
      router.replace(getAuthHomeHref(locale));
      return;
    }
    const returnTo = getSafeInternalReturnTo(searchParams.get('returnTo'), locale);
    if (returnTo && returnTo.split(/[?#]/, 1)[0] !== pathname) {
      router.replace(returnTo);
      return;
    }
    const previousPage = getSafeInternalReferrer(
      document.referrer,
      window.location.origin,
      locale,
    );

    if (previousPage && previousPage !== pathname) {
      router.replace(previousPage);
      return;
    }

    router.replace(fallback);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-stone-600 transition-colors hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:text-stone-300 dark:hover:text-white"
    >
      <ArrowLeft size={16} aria-hidden="true" />
      {labels[locale as keyof typeof labels] ?? labels.en}
    </button>
  );
}
