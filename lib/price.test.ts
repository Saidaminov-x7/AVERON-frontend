import { describe, expect, it } from 'vitest';
import { calculateDiscountPercent, formatUzs } from './price';

describe('formatUzs', () => {
  it('uses each storefront locale consistently', () => {
    expect(formatUzs(125000, 'en')).toBe('125,000 UZS');
    expect(formatUzs(125000, 'ru')).toBe('125 000 сум');
    expect(formatUzs(125000, 'uz')).toBe('125 000 so‘m');
  });

  it('handles decimal, invalid, and unknown-locale values predictably', () => {
    expect(formatUzs('125000.75', 'en')).toBe('125,001 UZS');
    expect(formatUzs(Number.NaN, 'ru')).toBe('0 сум');
    expect(formatUzs(null, 'fr')).toBe('0 сум');
  });
});

describe('calculateDiscountPercent', () => {
  it('never displays a full discount while the sale price is positive', () => {
    expect(calculateDiscountPercent(99_999, 99_999_999)).toBe(99);
    expect(calculateDiscountPercent(1, 1_000_000_000)).toBe(99);
  });

  it('rounds ordinary discounts and rejects invalid or non-discount prices', () => {
    expect(calculateDiscountPercent(88_000, 100_000)).toBe(12);
    expect(calculateDiscountPercent(99_600, 100_000)).toBe(1);
    expect(calculateDiscountPercent(0, 100_000)).toBeNull();
    expect(calculateDiscountPercent(100_000, 100_000)).toBeNull();
    expect(calculateDiscountPercent(Number.NaN, 100_000)).toBeNull();
  });
});
