import type { MetadataRoute } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://averon.uz').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/*/catalog', '/*/catalog/*', '/*/about', '/*/how-to-order', '/*/delivery', '/*/returns', '/*/size-guide', '/*/faq', '/*/support'],
        disallow: [
          '/api/',
          '/admin/',
          '/*/api/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
