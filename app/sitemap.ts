import type { MetadataRoute } from 'next';
import { externalBaseURL } from '@/lib/axios';
import { SITE_URL } from '@/lib/siteUrl';

const LOCALES = ['ru', 'uz', 'en'] as const;
const STATIC_PATHS = [
  '',
  '/catalog',
  '/about',
  '/how-to-order',
  '/delivery',
  '/returns',
  '/size-guide',
  '/faq',
  '/support',
] as const;
const PRODUCTS_PER_PAGE = 100;
const MAX_PRODUCT_PAGES = 100;

type SitemapProduct = { slug: string; publicId?: string | null; updatedAt?: string };

function getItems(payload: unknown): SitemapProduct[] {
  if (typeof payload !== 'object' || payload === null) return [];
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is SitemapProduct =>
    typeof item === 'object' &&
    item !== null &&
    typeof (item as { slug?: unknown }).slug === 'string' &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test((item as { slug: string }).slug) &&
    ((item as { publicId?: unknown }).publicId == null ||
      (typeof (item as { publicId?: unknown }).publicId === 'string' &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test((item as { publicId: string }).publicId))),
  );
}

async function getPublishedProducts(): Promise<SitemapProduct[]> {
  const products: SitemapProduct[] = [];
  for (let page = 1; page <= MAX_PRODUCT_PAGES; page += 1) {
    const response = await fetch(
      `${externalBaseURL}/api/v1/products?limit=${PRODUCTS_PER_PAGE}&page=${page}`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok) throw new Error(`Product sitemap request failed with ${response.status}`);
    const items = getItems(await response.json());
    products.push(...items);
    if (items.length < PRODUCTS_PER_PAGE) break;
  }
  return products;
}

function localizedRoute(path: string, locale: string) {
  return `${SITE_URL}/${locale}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [locale, localizedRoute(path, locale)]),
    );
    for (const locale of LOCALES) {
      routes.push({
        url: localizedRoute(path, locale),
        changeFrequency: path === '' || path === '/catalog' ? 'daily' : 'monthly',
        priority: path === '' ? 1 : path === '/catalog' ? 0.9 : 0.6,
        alternates: { languages },
      });
    }
  }

  try {
    const products = await getPublishedProducts();
    for (const product of products) {
      const path = `/catalog/${encodeURIComponent(product.publicId ?? product.slug)}`;
      const lastModified = product.updatedAt && !Number.isNaN(Date.parse(product.updatedAt))
        ? new Date(product.updatedAt)
        : undefined;
      const languages = Object.fromEntries(
        LOCALES.map((locale) => [locale, localizedRoute(path, locale)]),
      );
      for (const locale of LOCALES) {
        routes.push({
          url: localizedRoute(path, locale),
          ...(lastModified ? { lastModified } : {}),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: { languages },
        });
      }
    }
  } catch (error) {
    console.error('Could not load published products for the sitemap.', error);
  }

  return routes;
}
