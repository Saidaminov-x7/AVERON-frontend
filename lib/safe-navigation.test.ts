import { describe, expect, it } from 'vitest';
import {
  getAuthHomeHref,
  getRouteFallback,
  getSafeInternalReferrer,
  getSafeInternalReturnTo,
  getSafePreviousRoute,
  isAuthPathname,
  localizeHrefPreservingSafeQuery,
} from './safe-navigation';

describe('safe internal navigation', () => {
  it('keeps a same-locale product path and its query/hash', () => {
    expect(getSafeInternalReturnTo('/uz/catalog/item-1?color=blue#details', 'uz'))
      .toBe('/uz/catalog/item-1?color=blue#details');
  });

  it.each([
    '//evil.example/path',
    '/en/../login',
    '/en/%2e%2e/login',
    '/en/%252e%252e/login',
    '/en/%2f%2fevil.example',
    '/en\\@evil.example',
    'https://evil.example/en/profile',
    'javascript:alert(1)',
    'data:text/html,evil',
    'http://evil.example/en/profile',
    '/ru/profile',
    '/en/login',
  ])('rejects unsafe or unsuitable return target %s', (target) => {
    expect(getSafeInternalReturnTo(target, 'en')).toBeNull();
  });

  it('accepts only same-origin localized referrers', () => {
    expect(getSafeInternalReferrer('https://shop.example/ru/cart?source=product', 'https://shop.example', 'ru'))
      .toBe('/ru/cart?source=product');
    expect(getSafeInternalReferrer('https://evil.example/ru/cart', 'https://shop.example', 'ru'))
      .toBeNull();
    expect(getSafeInternalReferrer('', 'https://shop.example', 'ru')).toBeNull();
  });

  it('identifies auth routes and provides a deterministic safe fallback', () => {
    expect(isAuthPathname('/en/login', 'en')).toBe(true);
    expect(isAuthPathname('/uz/register/verify', 'uz')).toBe(true);
    expect(isAuthPathname('/en/orders/AV-1', 'en')).toBe(false);
    expect(getAuthHomeHref('en')).toBe('/en');
    expect(getAuthHomeHref('unsupported')).toBe('/ru');
    expect(getRouteFallback('/ru/forgot-password', 'ru')).toBe('/ru/login');
    expect(getRouteFallback('/en/login', 'en')).toBe('/en');
    expect(getRouteFallback('/en/register', 'en')).toBe('/en');
    expect(getRouteFallback('/en/catalog/product-1', 'en')).toBe('/en/catalog');
    expect(getRouteFallback('/en/checkout', 'en')).toBe('/en/cart');
  });

  it('allows only safe transitions and strictly prevents auth redirect loops', () => {
    expect(getSafePreviousRoute('/ru/login', '/ru/forgot-password', 'ru')).toBe('/ru/login');
    expect(getSafePreviousRoute('/en/register', '/en/login', 'en')).toBe('/en/register');
    expect(getSafePreviousRoute('/uz/forgot-password', '/uz/login', 'uz')).toBeNull();
    expect(getSafePreviousRoute('/ru/cart', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('https://evil.example/ru/cart', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('/ru/checkout', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('/ru/outfits', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('/ru/favorites', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('/ru/profile', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('/ru/orders', '/ru/login', 'ru')).toBeNull();
    expect(getSafePreviousRoute('/ru/catalog?q=boots', '/ru/login', 'ru')).toBe('/ru/catalog?q=boots');
    expect(getSafePreviousRoute('/ru/catalog/product-42', '/ru/login', 'ru')).toBe('/ru/catalog/product-42');
    expect(getSafePreviousRoute('/ru/login', '/ru/login', 'ru')).toBeNull();
  });

  it('preserves catalog query context across locale changes without copying unrelated params', () => {
    expect(localizeHrefPreservingSafeQuery(
      '/ru/catalog/item-1',
      '?country=CN&sort=price_asc&session=secret&q=boots',
      'en',
    )).toBe('/en/catalog/item-1?q=boots&country=CN&sort=price_asc');
  });
});
