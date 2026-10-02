import { externalBaseURL } from './axios';
import {
  buildProductSearchParams,
  parseStoreCategories,
  type ProductListResponse,
  type StoreCategory,
  type StoreProduct,
} from './products';

export type CatalogRequest =
  | { status: 'ready'; data: ProductListResponse }
  | { status: 'error'; data: ProductListResponse };

export type CategoryRequest =
  | { status: 'ready'; categories: StoreCategory[] }
  | { status: 'error'; categories: StoreCategory[] };

export type CatalogFacets = { sizes: string[]; colors: string[] };
export type CatalogFacetsRequest =
  | { status: 'ready'; facets: CatalogFacets }
  | { status: 'error'; facets: CatalogFacets };

const EMPTY_CATALOG: ProductListResponse = {
  items: [],
  pagination: { page: 1, limit: 24, total: 0, pages: 0 },
};

const EMPTY_FACETS: CatalogFacets = { sizes: [], colors: [] };

export async function loadStoreCatalogFacets(fetcher: typeof fetch = fetch): Promise<CatalogFacetsRequest> {
  try {
    const response = await fetcher(`${externalBaseURL}/api/v1/catalog-facets`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Catalog facet request failed: ${response.status}`);
    const data: unknown = await response.json();
    if (typeof data !== 'object' || data === null) throw new Error('Catalog facet response is invalid');
    const payload = data as Record<string, unknown>;
    if (!Array.isArray(payload.sizes) || !Array.isArray(payload.colors)) {
      throw new Error('Catalog facet response is incomplete');
    }
    return {
      status: 'ready',
      facets: {
        sizes: payload.sizes.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())),
        colors: payload.colors.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())),
      },
    };
  } catch {
    return { status: 'error', facets: EMPTY_FACETS };
  }
}

export async function loadStoreCatalog(
  filters: Record<string, string | string[] | undefined>,
  fetcher: typeof fetch = fetch,
): Promise<CatalogRequest> {
  const query = buildProductSearchParams(filters);

  try {
    const response = await fetcher(`${externalBaseURL}/api/v1/products?${query}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);

    const data = await response.json() as Partial<ProductListResponse>;
    if (!Array.isArray(data.items)) throw new Error('Catalog response has no product list');

    return {
      status: 'ready',
      data: {
        items: data.items as StoreProduct[],
        pagination: { ...EMPTY_CATALOG.pagination, ...data.pagination },
      },
    };
  } catch {
    return { status: 'error', data: EMPTY_CATALOG };
  }
}

export async function loadStoreCategories(fetcher: typeof fetch = fetch): Promise<CategoryRequest> {
  try {
    const response = await fetcher(`${externalBaseURL}/api/v1/categories`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Category request failed: ${response.status}`);

    return { status: 'ready', categories: parseStoreCategories(await response.json()) };
  } catch {
    return { status: 'error', categories: [] };
  }
}
