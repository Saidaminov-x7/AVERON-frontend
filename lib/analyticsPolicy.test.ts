import { describe, expect, it } from 'vitest';
import { isProductionAnalyticsEnabled } from './analyticsPolicy';
import { CONSENT_STORAGE_KEY, hasAnalyticsConsent } from './consent';

describe('production analytics policy', () => {
  it('requires explicit unexpired analytics consent before tracking', () => {
    expect(hasAnalyticsConsent()).toBe(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, analytics: false, updatedAt: Date.now() }));
    expect(hasAnalyticsConsent()).toBe(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, analytics: true, updatedAt: Date.now() }));
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('blocks local development and test hosts even when NODE_ENV is production', () => {
    for (const hostname of ['localhost', '127.0.0.1', 'averon.local', 'preview.averon.uz']) {
      expect(isProductionAnalyticsEnabled(hostname, 'development')).toBe(false);
      expect(isProductionAnalyticsEnabled(hostname, 'test')).toBe(false);
      expect(isProductionAnalyticsEnabled(hostname, 'production')).toBe(false);
    }
  });

  it('allows analytics only on the production storefront in production mode', () => {
    expect(isProductionAnalyticsEnabled('averon.uz', 'production')).toBe(true);
    expect(isProductionAnalyticsEnabled('AVERON.UZ', 'production')).toBe(true);
    expect(isProductionAnalyticsEnabled('averon.uz', 'test')).toBe(false);
    expect(isProductionAnalyticsEnabled('averon.uz', 'development')).toBe(false);
  });

  it('blocks known test runners even when production host and mode are supplied', () => {
    expect(isProductionAnalyticsEnabled('averon.uz', 'production', true)).toBe(false);
    expect(isProductionAnalyticsEnabled('averon.uz', 'production', false)).toBe(true);
  });

  it('blocks explicit local runtime targets even on the canonical production host', () => {
    expect(isProductionAnalyticsEnabled('averon.uz', 'production', false, 'local')).toBe(false);
    expect(isProductionAnalyticsEnabled('averon.uz', 'production', false, undefined)).toBe(true);
  });
});
