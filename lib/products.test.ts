import { describe, expect, it, vi } from 'vitest';
import api from './axios';
import {
  buildCatalogSearchParams,
  buildProductSearchParams,
  categoryName,
  getProduct,
  getProducts,
  parseStoreCategories,
  type StoreCategory,
} from './products';

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

describe('categoryName', () => {
  const category: StoreCategory = {
    slug: 'outerwear',
    name: { ru: 'Верхняя одежда', uz: 'Ustki kiyim', en: 'Outerwear' },
  };

  it.each([
    ['ru', 'Верхняя одежда'],
    ['uz', 'Ustki kiyim'],
    ['en', 'Outerwear'],
  ])('selects the %s category name', (locale, expected) => {
    expect(categoryName(category, locale)).toBe(expected);
  });

  describe('buildProductSearchParams', () => {
    it('preserves the category slug and pagination in the server-side catalog query', () => {
      const query = buildProductSearchParams({
        category: 'outerwear',
        country: 'CN',
        page: '2',
        q: ' coat ',
      });
      expect(query.get('category')).toBe('outerwear');
      expect(query.get('country')).toBe('CN');
      expect(query.get('page')).toBe('2');
      expect(query.get('q')).toBe('coat');
      expect(query.get('limit')).toBe('24');
    });

    it('keeps category, country, search, and pagination in catalog return URLs', () => {
      const query = buildCatalogSearchParams({
        category: 'outerwear',
        country: 'CN',
        page: '2',
        q: ' coat ',
      });

      expect(query.toString()).toBe('q=coat&country=CN&category=outerwear&page=2');
      expect(query.has('limit')).toBe(false);
    });
  });

  it('falls back to the existing category translations and slug', () => {
    expect(categoryName({ slug: 'outerwear', translations: { ru: { name: 'Верхняя одежда' } } }, 'uz'))
      .toBe('Верхняя одежда');
    expect(categoryName({ slug: 'outer-wear' }, 'en')).toBe('outer wear');
  });

  it('supports localized API name fields and uses available locale fallbacks', () => {
    const category: StoreCategory = {
      slug: 'outerwear',
      name: 'Outerwear',
      nameRu: 'Верхняя одежда',
      nameUz: 'Ustki kiyim',
      nameEn: 'Outerwear',
    };

    expect(categoryName(category, 'ru')).toBe('Верхняя одежда');
    expect(categoryName(category, 'uz')).toBe('Ustki kiyim');
    expect(categoryName(category, 'en')).toBe('Outerwear');
  });

  it('parses supported category response envelopes and only returns active categories', () => {
    const categories = parseStoreCategories({
      data: {
        items: [
          { slug: 'outerwear', active: true },
          { slug: 'archived', isActive: false },
          { slug: 'missing-status' },
          { name: 'Invalid', isActive: true },
        ],
      },
    });

    expect(categories.map(({ slug }) => slug)).toEqual(['outerwear']);
    expect(parseStoreCategories([{ slug: 'direct', isActive: true }])).toEqual([
      { slug: 'direct', isActive: true },
    ]);
    expect(parseStoreCategories([{ slug: 'api-category', active: true }])).toEqual([
      { slug: 'api-category', active: true },
    ]);
  });
});
