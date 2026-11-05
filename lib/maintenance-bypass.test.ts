import { describe, expect, it } from 'vitest';
import { createMaintenanceBypassToken, verifyMaintenanceBypassToken } from './maintenance-bypass';

const SECRET = 'test-maintenance-bypass-signing-secret-32-bytes';

describe('maintenance bypass token', () => {
  it('accepts an untampered token only before its expiry', () => {
    const now = 1_800_000_000_000;
    const token = createMaintenanceBypassToken(SECRET, now);
    if (!token) throw new Error('Expected a signed token for a valid test secret');

    expect(verifyMaintenanceBypassToken(token, SECRET, now)).toBe(true);
    expect(verifyMaintenanceBypassToken(token, SECRET, now + 24 * 60 * 60 * 1000)).toBe(false);
  });

  it.each([
    ['tampered token', (token: string) => `${token}x`, SECRET],
    ['wrong signing key', (token: string) => token, 'different-maintenance-secret-with-32-bytes'],
    ['legacy client-set value', () => 'true', SECRET],
    ['malformed token', () => 'not-a-token', SECRET],
  ])('rejects %s', (_label, changeToken, secret) => {
    const token = createMaintenanceBypassToken(SECRET, 1_800_000_000_000);
    if (!token) throw new Error('Expected a signed token for a valid test secret');
    expect(verifyMaintenanceBypassToken(changeToken(token), secret, 1_800_000_000_000)).toBe(false);
  });

  it('fails closed when signing secrets are missing or too short', () => {
    expect(createMaintenanceBypassToken('', 1_800_000_000_000)).toBeNull();
    expect(createMaintenanceBypassToken('short', 1_800_000_000_000)).toBeNull();
    expect(verifyMaintenanceBypassToken('true', undefined, 1_800_000_000_000)).toBe(false);
  });
});
