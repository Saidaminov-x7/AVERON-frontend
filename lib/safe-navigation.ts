const supportedLocales = new Set(['ru', 'uz', 'en']);
const authRoutes = new Set(['login', 'register', 'forgot-password', 'reset-password']);
const authBackTransitions: Record<string, Set<string>> = {
  login: new Set(['register']),
  register: new Set(['login']),
  'forgot-password': new Set(['login']),
  'reset-password': new Set(['forgot-password']),
};
const protectedAuthBackRoutes = new Set(['cart', 'checkout', 'orders', 'profile']);
const preservedLocaleQueryKeys = new Set([
  'q',
  'country',
  'category',
  'audience',
  'size',
  'color',
  'minPrice',
  'maxPrice',
  'sort',
  'page',
]);
const forbiddenEncodedPathCharacters = /%(?:2f|5c|2e)/i;
const forbiddenDoubleEncodedPathCharacters = /%25(?:2f|5c|2e)/i;

function routeSegment(pathname: string, locale: string): string | null {
  const prefix = `/${locale}`;
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return null;
  return pathname.slice(prefix.length).split('/').filter(Boolean)[0] ?? '';
}

export function getAuthHomeHref(locale: string): string {
  return `/${supportedLocales.has(locale) ? locale : 'ru'}`;
}

export function isAuthPathname(pathname: string, locale: string): boolean {
  if (!supportedLocales.has(locale)) return false;
  const firstRouteSegment = routeSegment(pathname, locale);
  return firstRouteSegment !== null && authRoutes.has(firstRouteSegment);
}

export function getSafeInternalReturnTo(value: string | null | undefined, locale: string): string | null {
  if (
    !value ||
    value.length > 2048 ||
    !supportedLocales.has(locale) ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\u0000-\u001f\\]/.test(value)
  ) {
    return null;
  }

  const rawPath = value.split(/[?#]/, 1)[0];
  if (
    !rawPath ||
    forbiddenEncodedPathCharacters.test(rawPath) ||
    forbiddenDoubleEncodedPathCharacters.test(rawPath)
  ) {
    return null;
  }

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  if (
    decodedPath.includes('\\') ||
    decodedPath.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    return null;
  }

  try {
    const url = new URL(value, 'https://averon.invalid');
    const localeRoot = `/${locale}`;
    if (
      url.origin !== 'https://averon.invalid' ||
      url.pathname.includes('//') ||
      (url.pathname !== localeRoot && !url.pathname.startsWith(`${localeRoot}/`))
    ) {
      return null;
    }

    const firstRouteSegment = url.pathname.slice(localeRoot.length).split('/').filter(Boolean)[0];
    if (firstRouteSegment && authRoutes.has(firstRouteSegment)) return null;

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getSafeReturnToQuery(value: string | null | undefined, locale: string): string {
  const safeReturnTo = getSafeInternalReturnTo(value, locale);
  return safeReturnTo ? `?${new URLSearchParams({ returnTo: safeReturnTo }).toString()}` : '';
}

export function getSafeGoogleAuthDestination(
  locale: string,
  returnTo: string | null | undefined,
  legacyRedirect: string | null | undefined,
): string {
  const safeFallback = `/${supportedLocales.has(locale) ? locale : 'ru'}/profile`;
  const safeReturnTo = getSafeInternalReturnTo(returnTo, locale);
  if (safeReturnTo) return safeReturnTo;

  if (!legacyRedirect || !legacyRedirect.startsWith('/') || legacyRedirect.startsWith('//')) return safeFallback;
  const hasLocalePrefix = /^\/(?:ru|uz|en)(?:\/|$)/.test(legacyRedirect);
  const localizedLegacyRedirect = hasLocalePrefix ? legacyRedirect : `/${locale}${legacyRedirect}`;
  return getSafeInternalReturnTo(localizedLegacyRedirect, locale) ?? safeFallback;
}

export function getSafePreviousRoute(
  value: string | null | undefined,
  currentPathname: string,
  locale: string,
): string | null {
  if (!value || !supportedLocales.has(locale)) return null;
  const currentIsAuth = isAuthPathname(currentPathname, locale);
  const candidate = getSafeInternalReturnTo(value, locale);
  if (!candidate) {
    // Auth-to-auth transitions are intentionally narrower than general returnTo values.
    const rawPath = value.split(/[?#]/, 1)[0];
    const decodedPath = (() => {
      try {
        return decodeURIComponent(rawPath);
      } catch {
        return '';
      }
    })();
    if (
      !decodedPath.startsWith(`/${locale}/`) ||
      decodedPath.includes('\\') ||
      decodedPath.split('/').some((segment) => segment === '.' || segment === '..')
    ) {
      return null;
    }
    const fromRoute = routeSegment(currentPathname, locale);
    const toRoute = routeSegment(decodedPath, locale);
    if (!fromRoute || !toRoute || !authBackTransitions[fromRoute]?.has(toRoute)) return null;
    return value;
  }

  if (currentIsAuth && protectedAuthBackRoutes.has(routeSegment(candidate, locale) ?? '')) {
    return null;
  }
  if (candidate.split(/[?#]/, 1)[0] === currentPathname) return null;
  if (isAuthPathname(currentPathname, locale) && isAuthPathname(candidate, locale)) return null;
  return candidate;
}

export function getRouteFallback(pathname: string, locale: string): string {
  if (!supportedLocales.has(locale)) return '/ru';
  const firstRouteSegment = routeSegment(pathname, locale);
  if (firstRouteSegment === 'login' || firstRouteSegment === 'register') {
    return getAuthHomeHref(locale);
  }
  if (firstRouteSegment === 'forgot-password' || firstRouteSegment === 'reset-password') {
    return `/${locale}/login`;
  }
  if (firstRouteSegment === 'catalog' && pathname.split('/').filter(Boolean).length > 2) {
    return `/${locale}/catalog`;
  }
  if (firstRouteSegment === 'orders' && pathname.split('/').filter(Boolean).length > 2) {
    return `/${locale}/orders`;
  }
  if (firstRouteSegment === 'checkout') return `/${locale}/cart`;
  return `/${locale}/catalog`;
}

export function localizeHrefPreservingSafeQuery(
  pathname: string,
  search: string,
  newLocale: string,
): string {
  const locale = supportedLocales.has(newLocale) ? newLocale : 'ru';
  const rest = pathname.replace(/^\/(ru|uz|en)(?=\/|$)/, '') || '/';
  const targetPath = `/${locale}${rest === '/' ? '' : rest}`;
  const params = new URLSearchParams(search);
  const preserved = new URLSearchParams();
  for (const key of preservedLocaleQueryKeys) {
    const value = params.get(key);
    if (value !== null && value.length <= 2048) preserved.set(key, value);
  }
  const query = preserved.toString();
  return query ? `${targetPath}?${query}` : targetPath;
}

export function getSafeInternalReferrer(
  referrer: string | null | undefined,
  currentOrigin: string,
  locale: string,
): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    if (url.origin !== currentOrigin) return null;
    return getSafeInternalReturnTo(`${url.pathname}${url.search}${url.hash}`, locale);
  } catch {
    return null;
  }
}
