import createNextIntlPlugin from 'next-intl/plugin';

// Указываем путь к файлу конфигурации (если он лежит в корне как i18n.ts)
const withNextIntl = createNextIntlPlugin('./i18n.ts');
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://averon-backend-production-128zjje.up.railway.app';
const upgradeInsecureRequests = process.env.NODE_ENV === 'production' ? ' upgrade-insecure-requests;' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This checkout lives beneath C:\\Users\\vosil, which has unrelated lockfiles and QA builds.
  // Keep Turbopack's source scan and module resolution inside this app repository.
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['127.0.0.1'],
  // Allow parallel local QA runs to use an isolated build without clobbering
  // another Next.js process that is already serving the shared checkout.
  distDir: process.env.AVERON_NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'averon.uz',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://yastatic.net https://accounts.google.com https://apis.google.com https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://accounts.google.com; img-src 'self' data: https: blob: https://mc.yandex.ru https://yastatic.net; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://mc.yandex.ru https://*.yandex.ru https://yastatic.net https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.firebasestorage.app https://*.tile.openstreetmap.org https://tile.openstreetmap.org " + backendUrl + " https://api.cloudflare.com; frame-src 'self' https://mc.yandex.ru https://accounts.google.com https://*.firebaseapp.com https://challenges.cloudflare.com https://www.google.com; child-src 'self' blob: https://mc.yandex.ru; object-src 'none'; base-uri 'self'; form-action 'self';" + upgradeInsecureRequests + (process.env.CSP_REPORT_URI ? " report-uri " + process.env.CSP_REPORT_URI + ";" : '')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self), payment=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Expect-CT',
            value: 'max-age=86400, enforce',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

// Обязательно оборачиваем конфигурацию в withNextIntl
export default withNextIntl(nextConfig);
