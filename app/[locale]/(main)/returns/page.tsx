import { use } from 'react';
import { useTranslations } from 'next-intl';
import { InfoPage } from '@/components/content/InfoPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = {
    ru: 'Возвраты',
    uz: 'Qaytarish',
    en: 'Returns',
  };
  return { title: titles[locale] || 'Returns' };
}

export default function ReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('infoPages.returns');

  const items = [
    { title: t('items.0.title'), text: t('items.0.text') },
    { title: t('items.1.title'), text: t('items.1.text') },
    { title: t('items.2.title'), text: t('items.2.text') },
    { title: t('items.3.title'), text: t('items.3.text') },
  ];

  return (
    <InfoPage
      locale={locale}
      eyebrow={t('eyebrow')}
      title={t('title')}
      description={t('description')}
      items={items}
    />
  );
}
