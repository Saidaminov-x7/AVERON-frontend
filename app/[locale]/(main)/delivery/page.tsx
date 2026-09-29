import { useTranslations } from 'next-intl';
import { InfoPage } from '@/components/content/InfoPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const titles: Record<string, string> = {
    ru: 'Доставка',
    uz: 'Yetkazib berish',
    en: 'Delivery',
  };
  return { title: titles[locale] || 'Delivery' };
}

export default function DeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  // Client component or server component with useTranslations
  return <DeliveryPageContent params={params} />;
}

import { use } from 'react';

function DeliveryPageContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations('infoPages.delivery');

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
