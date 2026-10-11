'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CatalogSelect } from './CatalogSelect';

export function CatalogSortControl() {
  const t = useTranslations('catalog');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const sort = searchParams.get('sort') || 'newest';

  const updateSort = (value: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set('sort', value);
    query.delete('page');
    startTransition(() => router.push(`${pathname}?${query.toString()}`));
  };

  return (
    <div aria-busy={isPending} className="w-full sm:w-56">
      <CatalogSelect
        name="sort"
        label={t('sort')}
        value={sort}
        placeholder={t('newest')}
        options={[
          { value: 'newest', label: t('newest') },
          { value: 'price_asc', label: t('cheap') },
          { value: 'price_desc', label: t('expensive') },
          { value: 'popular', label: t('popular') },
        ]}
        onValueChange={updateSort}
      />
    </div>
  );
}
