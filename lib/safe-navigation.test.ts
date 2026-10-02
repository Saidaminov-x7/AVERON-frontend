import { describe, expect, it } from 'vitest';
import { getAuthHomeHref, getSafeInternalReferrer, getSafeInternalReturnTo, isAuthPathname } from './safe-navigation';

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

  it('sends auth back navigation to a localized public home and never traverses back', () => {
    expect(isAuthPathname('/en/login', 'en')).toBe(true);
    expect(isAuthPathname('/uz/register/verify', 'uz')).toBe(true);
    expect(isAuthPathname('/en/orders/AV-1', 'en')).toBe(false);
    expect(getAuthHomeHref('en')).toBe('/en');
    expect(getAuthHomeHref('unsupported')).toBe('/ru');
  });
});
