// app/sitemap.ts
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://averon.uz';
const LOCALES = ['ru', 'uz', 'en'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Статические страницы для всех 3 локалей
  const staticPaths = [
    '',
    '/catalog',
    '/order-by-url',
    '/about',
    '/favorites',
    '/login',
    '/register',
    '/forgot-password',
  ];

  for (const locale of LOCALES) {
    for (const path of staticPaths) {
      routes.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '' || path === '/catalog' ? 'daily' : 'weekly',
        priority: path === '' ? 1.0 : path === '/catalog' ? 0.9 : 0.7,
        alternates: {
          languages: {
            ru: `${BASE_URL}/ru${path}`,
            uz: `${BASE_URL}/uz${path}`,
            en: `${BASE_URL}/en${path}`,
          },
        },
      });
    }
  }

  // Опубликованные товары (если API доступен)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/api/v1/products?limit=100`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        for (const item of items) {
          if (item.slug) {
            for (const locale of LOCALES) {
              routes.push({
                url: `${BASE_URL}/${locale}/catalog/${item.slug}`,
                lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
                alternates: {
                  languages: {
                    ru: `${BASE_URL}/ru/catalog/${item.slug}`,
                    uz: `${BASE_URL}/uz/catalog/${item.slug}`,
                    en: `${BASE_URL}/en/catalog/${item.slug}`,
                  },
                },
              });
            }
          }
        }
      }
    } catch {
      // При недоступности бэкенда во время build используем базовый sitemap
    }
  }

  return routes;
}
