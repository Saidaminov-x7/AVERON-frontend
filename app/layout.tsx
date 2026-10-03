import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/siteUrl';

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
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
  const configuredMetrikaId = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
  const metrikaId = configuredMetrikaId && /^[1-9]\d*$/.test(configuredMetrikaId)
    ? configuredMetrikaId
    : null;
  return (
    <html suppressHydrationWarning>
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
        {metrikaId && <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {
                    if (document.scripts[j].src === r) {
                      if (window.averonYandexReady) window.dispatchEvent(new Event('averon-yandex-ready'));
                      return;
                    }
                  }
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r;
                  k.onload=function(){window.averonYandexReady=true;window.dispatchEvent(new Event('averon-yandex-ready'));};
                  k.onerror=function(){window.averonYandexReady=false;};
                  a.parentNode.insertBefore(k,a)
              })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${metrikaId}', 'ym');

            `,
          }}
        />}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
