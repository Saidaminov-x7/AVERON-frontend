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
          '/*/admin',
          '/*/admin/',
          '/*/cart',
          '/*/checkout',
          '/*/checkout/',
          '/*/profile',
          '/*/profile/',
          '/*/orders',
          '/*/orders/',
          '/*/favorites',
          '/*/compare',
          '/*/wishlist',
          '/*/chat',
          '/*/mini-app',
          '/*/maintenance',
          '/*/orders/*',
          '/*/checkout/success/*',
          '/*/wishlist/shared/*',
          '/*/pages/*',
          '/*/register',
          '/*/login',
          '/*/forgot-password',
          '/*/reset-password',
          '/*/ai',
          '/*/outfits',
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
