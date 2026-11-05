import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const SECRET = 'test-maintenance-bypass-signing-secret-32-bytes';
const ORIGIN = 'https://averon.test';

describe('maintenance bypass route', () => {
  beforeEach(() => {
    vi.stubEnv('MAINTENANCE_BYPASS_SECRET', SECRET);
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function request(password: string, origin = ORIGIN) {
    return new NextRequest(`${ORIGIN}/api/maintenance/bypass`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ password }),
    });
  }

  it('sets a signed HttpOnly cookie only after the backend accepts the password', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ allowed: true }), { status: 200 }));

    const response = await POST(request('a-valid-access-password'));
    const cookie = response.headers.get('set-cookie') || '';

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ allowed: true });
    expect(cookie).toContain('maintenance_bypass=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toContain('maintenance_bypass=true');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('does not issue a cookie for rejected passwords', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ allowed: false }), { status: 401 }));

    const response = await POST(request('wrong-password'));

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({ allowed: false });
  });

  it('fails closed when the signing secret is not configured', async () => {
    vi.stubEnv('MAINTENANCE_BYPASS_SECRET', '');

    const response = await POST(request('a-valid-access-password'));

    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({ allowed: false, unavailable: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects cross-origin requests before contacting the backend', async () => {
    const response = await POST(request('a-valid-access-password', 'https://attacker.test'));

    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
