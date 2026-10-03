import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/siteUrl';

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
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
