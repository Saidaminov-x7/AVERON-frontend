import { describe, expect, it, vi } from 'vitest';
import api from './axios';
import { getProduct, getProducts } from './products';

vi.mock('./axios', () => ({ default: { get: vi.fn() } }));

describe('products API', () => {
  it('returns the catalog response without demo fallback', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } } });
    await expect(getProducts()).resolves.toMatchObject({ items: [], pagination: { total: 0 } });
  });

  it('returns null only for a real 404 and rethrows network errors', async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 404 } });
    await expect(getProduct('missing')).resolves.toBeNull();
    vi.mocked(api.get).mockRejectedValueOnce(new Error('offline'));
    await expect(getProduct('product-1')).rejects.toThrow('offline');
  });
});
