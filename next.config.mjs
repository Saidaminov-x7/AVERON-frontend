import createNextIntlPlugin from 'next-intl/plugin';

// Указываем путь к файлу конфигурации (если он лежит в корне как i18n.ts)
const withNextIntl = createNextIntlPlugin('./i18n.ts');
const productionBackendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://averon-backend-production.up.railway.app';
const isIsolatedEnvironment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  || Boolean(process.env.VITEST || process.env.JEST_WORKER_ID)
  || process.env.NEXT_PUBLIC_AVERON_RUNTIME_TARGET === 'local';
const backendUrl = isIsolatedEnvironment
  ? process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL || 'http://127.0.0.1:8080'
  : productionBackendUrl;
if (isIsolatedEnvironment) {
  let parsedBackendUrl;
  try {
    parsedBackendUrl = new URL(backendUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL in development and test.');
  }
  const addressOctets = parsedBackendUrl.hostname.split('.');
  const numericOctets = addressOctets.map(Number);
  const isLoopbackIpv4 = addressOctets.length === 4
    && addressOctets.every((octet, index) => /^\d{1,3}$/.test(octet)
      && numericOctets[index] >= 0 && numericOctets[index] <= 255)
    && numericOctets[0] === 127;
  const isLoopbackHostname = parsedBackendUrl.hostname === 'localhost'
    || parsedBackendUrl.hostname === '[::1]'
    || isLoopbackIpv4;
  if (parsedBackendUrl.protocol !== 'http:' || !isLoopbackHostname || parsedBackendUrl.username
    || parsedBackendUrl.password || parsedBackendUrl.pathname !== '/' || parsedBackendUrl.search
    || parsedBackendUrl.hash) {
    throw new Error('NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL in development and test.');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Turbopack rooted in this app rather than a parent user's lockfile.
  turbopack: { root: process.cwd() },
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.google.com https://www.gstatic.com https://cdn.jsdelivr.net https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://accounts.google.com; img-src 'self' data: https: blob: " + backendUrl + "; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.firebasestorage.app https://*.tile.openstreetmap.org https://tile.openstreetmap.org " + backendUrl + " https://api.cloudflare.com; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://challenges.cloudflare.com https://www.google.com; child-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;" + (!isIsolatedEnvironment && process.env.CSP_REPORT_URI ? " report-uri " + process.env.CSP_REPORT_URI + ";" : '')
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
