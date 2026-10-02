import LayoutServer from './layout-server'
import type { Metadata } from 'next';

const localeMetadata = {
  ru: {
    title: 'Магазин',
    description: 'Одежда, обувь и аксессуары из Китая с доставкой по Узбекистану.',
  },
  uz: {
    title: "Do'kon",
    description: "Xitoydan kiyim, poyabzal va aksessuarlar — O'zbekiston bo'ylab yetkazib berish bilan.",
  },
  en: {
    title: 'Store',
    description: 'Clothing, shoes, and accessories from China, delivered across Uzbekistan.',
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = localeMetadata[locale as keyof typeof localeMetadata] ?? localeMetadata.ru;

  return {
    title: copy.title,
    description: copy.description,
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