import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAINTENANCE_BYPASS_COOKIE = 'maintenance_bypass';
export const MAINTENANCE_BYPASS_MAX_AGE_SECONDS = 24 * 60 * 60;

const VERSION = 'v1';
const MIN_SECRET_BYTES = 32;

function isUsableSecret(secret: string | undefined): secret is string {
  return typeof secret === 'string' && Buffer.byteLength(secret, 'utf8') >= MIN_SECRET_BYTES;
}

function signature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createMaintenanceBypassToken(
  secret: string | undefined,
  now = Date.now(),
): string | null {
  if (!isUsableSecret(secret) || !Number.isFinite(now)) return null;

  const expiresAt = Math.floor(now / 1000) + MAINTENANCE_BYPASS_MAX_AGE_SECONDS;
  const payload = `${VERSION}.${expiresAt}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyMaintenanceBypassToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  if (!token || !isUsableSecret(secret) || !Number.isFinite(now)) return false;

  const [version, expiresAtText, providedSignature, extra] = token.split('.');
  if (version !== VERSION || !expiresAtText || !providedSignature || extra !== undefined) return false;
  if (!/^\d+$/.test(expiresAtText) || !/^[a-f0-9]{64}$/.test(providedSignature)) return false;

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt * 1000 <= now) return false;

  const payload = `${version}.${expiresAtText}`;
  const expectedSignature = Buffer.from(signature(payload, secret), 'hex');
  const suppliedSignature = Buffer.from(providedSignature, 'hex');
  return expectedSignature.length === suppliedSignature.length
    && timingSafeEqual(expectedSignature, suppliedSignature);
}
