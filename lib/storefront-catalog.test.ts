import { describe, expect, it, vi } from 'vitest';
import { loadStoreCatalog, loadStoreCatalogFacets, loadStoreCategories } from './storefront-catalog';

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response;
}

describe('storefront catalog requests', () => {
  it('sends catalog filters and the requested page to the server', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [],
      pagination: { page: 2, limit: 24, total: 31, pages: 2 },
    }));

    const result = await loadStoreCatalog({
      category: 'outerwear',
      country: 'CN',
      page: '2',
      q: ' coat ',
      size: 'M',
      sort: 'price_asc',
    }, fetcher);

    const [requestUrl, options] = fetcher.mock.calls[0];
    const request = new URL(String(requestUrl));
    expect(request.searchParams.get('category')).toBe('outerwear');
    expect(request.searchParams.get('country')).toBe('CN');
    expect(request.searchParams.get('page')).toBe('2');
    expect(request.searchParams.get('q')).toBe('coat');
    expect(request.searchParams.get('size')).toBe('M');
    expect(request.searchParams.get('sort')).toBe('price_asc');
    expect(request.searchParams.get('limit')).toBe('24');
    expect(options).toMatchObject({ cache: 'no-store' });
    expect(result).toMatchObject({ status: 'ready', data: { pagination: { page: 2, pages: 2 } } });
  });

  it('distinguishes failed product loads from a successfully empty catalog', async () => {
    const failedFetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, false));
    const failed = await loadStoreCatalog({}, failedFetcher);
    expect(failed).toMatchObject({ status: 'error', data: { items: [], pagination: { total: 0 } } });

    const emptyFetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ items: [], pagination: { total: 0 } }));
    const empty = await loadStoreCatalog({}, emptyFetcher);
    expect(empty).toMatchObject({ status: 'ready', data: { items: [], pagination: { total: 0 } } });
  });

  it('only exposes active categories and preserves a category request error for the UI', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      data: [
        { slug: 'outerwear', active: true, name: { uz: 'Ustki kiyim' } },
        { slug: 'archived', active: false },
      ],
    }));
    await expect(loadStoreCategories(fetcher)).resolves.toMatchObject({
      status: 'ready',
      categories: [{ slug: 'outerwear', active: true, name: { uz: 'Ustki kiyim' } }],
    });

    const failedFetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    await expect(loadStoreCategories(failedFetcher)).resolves.toEqual({ status: 'error', categories: [] });
  });

  it('loads canonical catalog facets and reports facet request failures', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      sizes: ['M', ' ', null, 'One size'],
      colors: ['Black', 12, 'Navy'],
    }));
    await expect(loadStoreCatalogFacets(fetcher)).resolves.toEqual({
      status: 'ready',
      facets: { sizes: ['M', 'One size'], colors: ['Black', 'Navy'] },
    });

    const failedFetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    await expect(loadStoreCatalogFacets(failedFetcher)).resolves.toEqual({
      status: 'error',
      facets: { sizes: [], colors: [] },
    });
  });

  it('preserves explicit all-countries filter state for product return navigation', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [],
      pagination: { page: 1, limit: 24, total: 0, pages: 0 },
    }));
    await loadStoreCatalog({ country: '' }, fetcher);

    const request = new URL(String(fetcher.mock.calls[0][0]));
    expect(request.searchParams.has('country')).toBe(true);
    expect(request.searchParams.get('country')).toBe('');
  });
});
