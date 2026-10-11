export type StoreLocale = 'ru' | 'uz' | 'en';

const currencyLabels: Record<StoreLocale, string> = {
  ru: 'сум',
  uz: 'so‘m',
  en: 'UZS',
};

function formatGroupedAmount(value: number, locale: StoreLocale): string {
  // Keep SSR and browser output identical. ICU's uz-UZ grouping separator can
  // differ between Node and Chromium, which otherwise causes hydration errors.
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
  return locale === 'en' ? grouped : grouped.replace(/,/g, '\u00a0');
}

export function formatUzs(amount: number | string | null | undefined, locale: string): string {
  const normalizedLocale: StoreLocale = locale === 'en' || locale === 'uz' ? locale : 'ru';
  const value = Number(amount);
  const formatted = Number.isFinite(value)
    ? formatGroupedAmount(value, normalizedLocale)
    : '0';

  return `${formatted} ${currencyLabels[normalizedLocale]}`;
}

export function calculateDiscountPercent(currentPrice: number, compareAtPrice: number): number | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null;
  if (!Number.isFinite(compareAtPrice) || compareAtPrice <= currentPrice) return null;

  // A positive sale price can never represent a full 100% discount.
  return Math.min(99, Math.max(1, Math.round((1 - currentPrice / compareAtPrice) * 100)));
}
