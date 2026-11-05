import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';
import { createMaintenanceBypassToken } from './lib/maintenance-bypass';

const BYPASS_SECRET = 'test-maintenance-bypass-signing-secret-32-bytes';

describe('maintenance proxy redirects', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('saves the localized request path and query before redirecting to maintenance', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ maintenanceMode: true }), { status: 200 }));
    const request = new NextRequest('https://averon.test/ru/catalog/coat?size=M&sort=recent');

    const response = await proxy(request);
    const location = new URL(response.headers.get('location')!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe('/ru/maintenance');
    expect(location.searchParams.get('returnTo')).toBe('/ru/catalog/coat?size=M&sort=recent');
  });

  it('returns from maintenance to the saved local destination and falls back to localized home', async () => {
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ maintenanceMode: false }), { status: 200 }));
    const savedRequest = new NextRequest('https://averon.test/ru/maintenance?returnTo=%2Fru%2Forders%3Ftab%3Dactive');
    const savedResponse = await proxy(savedRequest);
    expect(new URL(savedResponse.headers.get('location')!).pathname + new URL(savedResponse.headers.get('location')!).search)
      .toBe('/ru/orders?tab=active');

    const directResponse = await proxy(new NextRequest('https://averon.test/uz/maintenance'));
    expect(new URL(directResponse.headers.get('location')!).pathname).toBe('/uz');
  });

  it('does not trust a client-created maintenance bypass cookie', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ maintenanceMode: true }), { status: 200 }));
    const request = new NextRequest('https://averon.test/ru/catalog', {
      headers: { cookie: 'maintenance_bypass=true' },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location')!).pathname).toBe('/ru/maintenance');
  });

  it('accepts only a signed, unexpired maintenance bypass cookie', async () => {
    vi.stubEnv('MAINTENANCE_BYPASS_SECRET', BYPASS_SECRET);
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ maintenanceMode: true }), { status: 200 }));
    const token = createMaintenanceBypassToken(BYPASS_SECRET)!;
    const request = new NextRequest('https://averon.test/ru/catalog', {
      headers: { cookie: `maintenance_bypass=${token}` },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
