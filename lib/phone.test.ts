import { describe, expect, it } from 'vitest';
import { formatUzbekPhoneInput, normalizeUzbekPhoneInput } from './phone';

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
});
