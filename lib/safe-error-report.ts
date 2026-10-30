export function getSafeErrorReportPath(): string {
  if (typeof window === 'undefined') return '';
  const [locale, section] = window.location.pathname.split('/').filter(Boolean);
  const safeLocale = ['ru', 'uz', 'en'].includes(locale ?? '') ? locale : 'unknown';
  const safeSections = new Set([
    'catalog', 'categories', 'pages', 'about', 'contacts', 'support', 'privacy', 'terms',
    'cart', 'checkout', 'profile', 'orders', 'favorites', 'compare', 'search', 'maintenance',
  ]);
  return `/${safeLocale}${section && safeSections.has(section) ? `/${section}` : ''}`;
}
