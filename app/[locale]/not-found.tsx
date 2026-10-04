'use client';

import { SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatusPage } from '@/components/feedback/StatusPage';

export default function NotFound() {
  const t = useTranslations('NotFound');
  return <StatusPage code="404" eyebrow="Страница не найдена" title={t('title')} description={t('description')} icon={SearchX} homeLabel={t('backToHome')} />;
}
