export const COOKIE_CONSENT_KEY = 'averon_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'averon:cookie-consent-change';
export const COOKIE_SETTINGS_OPEN_EVENT = 'averon:cookie-settings-open';

export type CookieConsent = { necessary: true; analytics: boolean; savedAt: string };

let sessionConsent: CookieConsent | null = null;

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return sessionConsent;
    const value = JSON.parse(raw) as Partial<CookieConsent>;
    if (value.necessary !== true || typeof value.analytics !== 'boolean') return null;
    return { necessary: true, analytics: value.analytics, savedAt: String(value.savedAt || '') };
  } catch {
    return sessionConsent;
  }
}

export function saveCookieConsent(analytics: boolean): CookieConsent {
  const consent = { necessary: true as const, analytics, savedAt: new Date().toISOString() };
  sessionConsent = consent;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Keep the choice for this page session if browser storage is unavailable.
  }
  if (!analytics) {
    try {
      window.localStorage.removeItem('averon_device_id');
    } catch {
      // The identifier cannot be removed while storage is blocked, but no event is sent.
    }
  }
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
  return consent;
}
