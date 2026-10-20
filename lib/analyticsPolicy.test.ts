import { describe, expect, it } from 'vitest';
import { isProductionAnalyticsEnabled } from './analyticsPolicy';

describe('production analytics policy', () => {
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
