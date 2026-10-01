const supportedLocales = new Set(['ru', 'uz', 'en']);
const authRoutes = new Set(['login', 'register', 'forgot-password', 'reset-password']);
const forbiddenEncodedPathCharacters = /%(?:2f|5c|2e)/i;
const forbiddenDoubleEncodedPathCharacters = /%25(?:2f|5c|2e)/i;

export function getAuthHomeHref(locale: string): string {
  return `/${supportedLocales.has(locale) ? locale : 'ru'}`;
}

export function isAuthPathname(pathname: string, locale: string): boolean {
  if (!supportedLocales.has(locale)) return false;
  const [firstRouteSegment] = pathname.slice(`/${locale}/`.length).split('/');
  return authRoutes.has(firstRouteSegment);
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
