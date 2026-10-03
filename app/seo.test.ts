import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from './robots';
import sitemap from './sitemap';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SEO route metadata', () => {
  it('points robots.txt at the approved production sitemap', () => {
    expect(robots().sitemap).toBe('https://averon.uz/sitemap.xml');
  });

  it('keeps generated sitemap URLs on the approved public routes and origin', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ slug: 'sample-product' }] }),
    }));

    const entries = await sitemap();
    const urls = entries.map(({ url }) => url);

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.startsWith('https://averon.uz/'))).toBe(true);
    expect(urls).toContain('https://averon.uz/ru/catalog/sample-product');
    expect(urls.some((url) => /\/(?:listings|account|admin)(?:\/|$)/.test(url))).toBe(false);
  });
});
