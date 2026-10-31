const SUPPORTED_LOCALES = new Set(['ru', 'uz', 'en']);
const RETURN_URL_ORIGIN = 'https://averon.invalid';

export function safeMaintenanceReturnPath(returnTo: string | null | undefined, locale: string): string {
  const safeLocale = SUPPORTED_LOCALES.has(locale) ? locale : 'ru';
  const localizedHome = `/${safeLocale}`;
  const candidate = returnTo?.trim();

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\') || /[\u0000-\u001f\u007f]/.test(candidate)) {
    return localizedHome;
  }

  try {
    const target = new URL(candidate, RETURN_URL_ORIGIN);
    if (target.origin !== RETURN_URL_ORIGIN) return localizedHome;
    if (target.pathname === '/maintenance' || target.pathname.endsWith('/maintenance')) return localizedHome;
    if (target.pathname !== localizedHome && !target.pathname.startsWith(`${localizedHome}/`)) return localizedHome;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return localizedHome;
  }
}
