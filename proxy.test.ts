import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

describe('maintenance proxy redirects', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

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
});
