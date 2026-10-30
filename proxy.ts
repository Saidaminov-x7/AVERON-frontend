import { NextRequest, NextResponse } from 'next/server';
import { isLocalApiHost } from './lib/api-origin';

// Configuration
const locales = ['uz', 'en', 'ru'];
const defaultLocale = 'ru';

// Main proxy function
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore technical files, API routes, and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Maintenance mode check via backend API
  const isMaintenancePage = pathname.includes('/maintenance');
  const API_BASE_URL = isLocalApiHost(request.nextUrl.hostname)
    ? process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL || 'http://127.0.0.1:8080'
    : process.env.NEXT_PUBLIC_API_URL || 'https://averon-backend-production.up.railway.app';

  const bypassCookie = request.cookies.get('maintenance_bypass')?.value;
  const locale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;

  try {
    const maintenanceRes = await fetch(`${API_BASE_URL}/site-settings/public`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(3000),
    });
    if (maintenanceRes.ok) {
      const data = await maintenanceRes.json();
      const isUnderMaintenance = Boolean(data?.maintenanceMode);

      // 1. Если техобслуживание включено, но нет байпасс-куки и мы не на странице maintenance -> редирект на maintenance
      if (isUnderMaintenance && !isMaintenancePage && !bypassCookie) {
        const maintenanceUrl = new URL(`/${locale}/maintenance`, request.url);
        maintenanceUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(maintenanceUrl);
      }

      // 2. Если техобслуживание ВЫКЛЮЧЕНО (или есть активный байпасс), но пользователь перешел на /maintenance -> редирект на главную
      if ((!isUnderMaintenance || bypassCookie) && isMaintenancePage) {
        const returnTo = request.nextUrl.searchParams.get('returnTo');
        const safeReturnTo = returnTo?.startsWith(`/${locale}/`) || returnTo === `/${locale}`
          ? returnTo
          : `/${locale}`;
        return NextResponse.redirect(new URL(safeReturnTo, request.url));
      }
    }
  } catch {
    // Non-blocking if API fails to respond
  }

  // Check if pathname starts with a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to locale-prefixed URL
    const url = new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}`, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)',
  ],
};

