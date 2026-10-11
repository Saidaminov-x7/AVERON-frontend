import { describe, expect, it } from 'vitest';
import { formatUzbekPhoneInput, hasUnsupportedInternationalPhoneCountryCode, normalizeUzbekPhoneInput } from './phone';

describe('Uzbek phone input', () => {
  it('formats progressively and normalizes pasted values', () => {
    expect(formatUzbekPhoneInput('901234567')).toBe('+998 90 123 45 67');
    expect(formatUzbekPhoneInput('+998901234567')).toBe('+998 90 123 45 67');
    expect(normalizeUzbekPhoneInput('+998 (90) 123-45-67')).toBe('+998901234567');
  });

  it('rejects values that are not Uzbek mobile numbers', () => {
    expect(normalizeUzbekPhoneInput('+1 202 555 0147')).toBeNull();
    expect(normalizeUzbekPhoneInput('90123456')).toBeNull();
  });

  it('keeps the Uzbekistan prefix when users erase or paste a foreign prefix', () => {
    expect(formatUzbekPhoneInput('')).toBe('+998 ');
    expect(formatUzbekPhoneInput('+998')).toBe('+998 ');
    expect(formatUzbekPhoneInput('+1 202 555 0147')).toBe('+998 12 025 55 01');
  });

  it('detects explicit international country codes that are not Uzbekistan', () => {
    expect(hasUnsupportedInternationalPhoneCountryCode('+1 202 555 0147')).toBe(true);
    expect(hasUnsupportedInternationalPhoneCountryCode('0044 20 7946 0958')).toBe(true);
    expect(hasUnsupportedInternationalPhoneCountryCode('+998 90 123 45 67')).toBe(false);
    expect(hasUnsupportedInternationalPhoneCountryCode('998901234567')).toBe(false);
    expect(hasUnsupportedInternationalPhoneCountryCode('901234567')).toBe(false);
  });
});
