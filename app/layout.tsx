import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { SITE_URL } from '@/lib/siteUrl';
import './[locale]/globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter', display: 'swap' });

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'AVERON',
  url: SITE_URL,
  logo: `${SITE_URL}/logotip.png`,
  sameAs: ['https://t.me/averon_fashion'],
};
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'AVERON',
  url: SITE_URL,
  inLanguage: ['ru', 'uz', 'en'],
};

export const metadata: Metadata = {
  title: { default: 'AVERON', template: '%s | AVERON' },
  description: 'Shop clothing, shoes, and accessories with delivery across Uzbekistan.',
};

async function getServerSettings() {
  try {
    const isLocalRuntime = process.env.NEXT_PUBLIC_AVERON_RUNTIME_TARGET === 'local' || process.env.NODE_ENV !== 'production';
    const apiUrl = isLocalRuntime
      ? process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL || 'http://127.0.0.1:8080'
      : process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error('no apiUrl');
    const res = await fetch(`${apiUrl}/site-settings/public`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error('settings fetch failed');
    return await res.json();
  } catch {
    return {
      mobilePinchZoomEnabled: true,
    };
  }
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getServerSettings();
  const allowZoom = settings.mobilePinchZoomEnabled !== false;
  return { width: 'device-width', initialScale: 1, minimumScale: 1, maximumScale: allowZoom ? 5 : 1, userScalable: allowZoom, viewportFit: 'cover', themeColor: [{ media: '(prefers-color-scheme: light)', color: '#fafafa' }, { media: '(prefers-color-scheme: dark)', color: '#0f0f10' }] };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className={inter.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/logotip.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
