import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSafeErrorReportPath } from './safe-error-report';

describe('getSafeErrorReportPath', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps only a localized static route prefix and drops dynamic path segments', () => {
    vi.stubGlobal('window', { location: { pathname: '/ru/catalog/private-product-slug' } });
    expect(getSafeErrorReportPath()).toBe('/ru/catalog');
  });

  it('does not include arbitrary or personal-looking route segments', () => {
    vi.stubGlobal('window', { location: { pathname: '/ru/person@example.com/private-id' } });
    expect(getSafeErrorReportPath()).toBe('/ru');
  });
});
