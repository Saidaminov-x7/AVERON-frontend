import { describe, expect, it } from 'vitest';
import { safeMaintenanceReturnPath } from './maintenance-return';

describe('safeMaintenanceReturnPath', () => {
  it('preserves a same-origin localized path, query, and hash', () => {
    expect(safeMaintenanceReturnPath('/ru/catalog/coat?sort=new&page=2#reviews', 'ru'))
      .toBe('/ru/catalog/coat?sort=new&page=2#reviews');
  });

  it('falls back to the localized home for direct entry without a return path', () => {
    expect(safeMaintenanceReturnPath(null, 'uz')).toBe('/uz');
    expect(safeMaintenanceReturnPath(undefined, 'en')).toBe('/en');
  });

  it.each([
    'https://evil.example/ru/catalog',
    '//evil.example/ru/catalog',
    '/\\\\evil.example/ru/catalog',
    '/en/catalog',
    '/ru/maintenance?returnTo=/ru/catalog',
  ])('rejects unsafe or non-local return target %s', (candidate) => {
    expect(safeMaintenanceReturnPath(candidate, 'ru')).toBe('/ru');
  });
});
