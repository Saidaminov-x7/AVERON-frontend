import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackCommerceEvent } from './commerceAnalytics';

vi.mock('@/lib/axios', () => ({ externalBaseURL: 'https://api.example.test' }));

const uuid = '00000000-0000-4000-8000-000000000001';

describe('trackCommerceEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sends bounded event metadata without query contents', () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window.crypto, 'randomUUID').mockReturnValue(uuid);
    window.history.replaceState({}, '', '/ru/catalog?secret=not-collected');

    trackCommerceEvent({ eventName: 'catalog_filter', metadata: { country: 'CN', size: 'M' } });

    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      eventId: uuid,
      deviceId: uuid,
      eventName: 'catalog_filter',
      path: '/ru/catalog',
      metadata: { country: 'CN', size: 'M' },
    });
    expect(JSON.stringify(body)).not.toContain('not-collected');
  });

  it('deduplicates rapid duplicate route events', () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(window.crypto, 'randomUUID').mockReturnValue(uuid);

    trackCommerceEvent({ eventName: 'page_view' });
    trackCommerceEvent({ eventName: 'page_view' });

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
