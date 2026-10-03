'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LanguageFlag, type LocaleFlagCode} from '@/components/ui/LanguageFlag';

const locales = [
  {code: 'ru', label: 'Русский'},
  {code: 'uz', label: 'O‘zbekcha'},
  {code: 'en', label: 'English'}
] satisfies Array<{code: LocaleFlagCode; label: string}>;

export function LocaleSwitcher({currentLocale}: {currentLocale: string}) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const rest = segments.slice(1).join('/');

  return (
    <div className="flex gap-2">
      {locales.map(({code, label}) => {
        const href = rest ? `/${code}/${rest}` : `/${code}`;
        const active = currentLocale === code;

        return (
          <Link
            key={code}
            href={href}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              active
                ? 'border-primary-600 bg-primary-600 text-white dark:border-primary-500 dark:bg-primary-600'
                : 'border-stone-300 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
            }`}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
          >
            <LanguageFlag locale={code} />
          </Link>
        );
      })}
    </div>
  );
}
