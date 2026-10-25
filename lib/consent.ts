export const CONSENT_STORAGE_KEY = 'averon-privacy-choice-v1';
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type OptionalConsent = {
  analytics: boolean;
  updatedAt: number;
  version: typeof CONSENT_VERSION;
};

export function parseOptionalConsent(value: string | null, now = Date.now()): OptionalConsent | null {
  if (!value) return null;
  try {
    const choice = JSON.parse(value) as Partial<OptionalConsent>;
    if (choice.version !== CONSENT_VERSION || typeof choice.analytics !== 'boolean'
      || typeof choice.updatedAt !== 'number' || !Number.isFinite(choice.updatedAt)
      || choice.updatedAt > now || now - choice.updatedAt > CONSENT_MAX_AGE_MS) return null;
    return { version: CONSENT_VERSION, analytics: choice.analytics, updatedAt: choice.updatedAt };
  } catch {
    return null;
  }
}

export function readOptionalConsent(): OptionalConsent | null {
  try {
    return parseOptionalConsent(localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveOptionalConsent(analytics: boolean): OptionalConsent | null {
  const choice: OptionalConsent = { version: CONSENT_VERSION, analytics, updatedAt: Date.now() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
    window.dispatchEvent(new Event('averon-consent-change'));
    return choice;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readOptionalConsent()?.analytics === true;
}

export function subscribeToConsentChanges(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('averon-consent-change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('averon-consent-change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function clearAnalyticsIdentifier() {
  try {
    localStorage.removeItem('averon_device_id');
  } catch {
    // Analytics is optional and unavailable storage must not affect shopping.
  }
}
