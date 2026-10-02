import LayoutServer from './layout-server'
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('storeTitle');
  const description = t('storeDescription');

  return {
    title: { default: title, template: '%s | AVERON' },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://averon.uz'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ru: '/ru',
        uz: '/uz',
        en: '/en',
        'x-default': '/ru',
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'AVERON',
      locale: locale === 'uz' ? 'uz_UZ' : locale === 'en' ? 'en_US' : 'ru_RU',
      title,
      description,
      url: `/${locale}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <LayoutServer params={params}>{children}</LayoutServer>;
}

export function generateStaticParams() {
  return ['uz', 'en', 'ru'].map((locale) => ({ locale }));
}