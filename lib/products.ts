import api from './axios';
type Translation = { title?: string; name?: string } | string;
type LocalizedName = string | Record<string, string | undefined>;

export type StoreCategory = {
  slug: string;
  name?: LocalizedName;
  translations?: Record<string, Translation>;
};

export type StoreProduct = {
  id: string;
  slug: string;
  source?: string | null;
  sourceUrl?: string | null;
  translations?: Record<string, Translation>;
  salePriceUzs: string | number;
  compareAtPriceUzs?: string | number | null;
  images?: Array<{ id?: string; url: string; alt?: Record<string, string> }>;
  category?: StoreCategory | null;
  material?: string | null;
  attributes?: Record<string, unknown> | null;
  variants?: Array<{ id: string; color?: string | null; size?: string | null; stock?: number }>;
};

export function productTitle(product: StoreProduct, locale = 'ru') {
  const value = product.translations?.[locale] ?? product.translations?.ru;
  if (typeof value === 'string') return value;
  return value?.title ?? value?.name ?? product.slug.replaceAll('-', ' ');
}

export function categoryName(category: StoreCategory, locale = 'ru') {
  if (typeof category.name === 'string') return category.name;
  const localizedName = category.name?.[locale] ?? category.name?.ru;
  if (localizedName) return localizedName;

  const translation = category.translations?.[locale] ?? category.translations?.ru;
  if (typeof translation === 'string') return translation;
  return translation?.name ?? translation?.title ?? category.slug.replaceAll('-', ' ');
}

export interface ProductListResponse {
  items: StoreProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function buildProductSearchParams(filters: Record<string, string | string[] | undefined>, limit = 24) {
  const query = new URLSearchParams();
  for (const key of ['q', 'country', 'category', 'audience', 'size', 'color', 'minPrice', 'maxPrice', 'sort', 'page']) {
    const value = filters[key];
    if (typeof value === 'string' && value.trim()) query.set(key, value.trim());
  }
  query.set('limit', String(limit));
  return query;
}

export async function getProducts(params: Record<string, string | number> = {}): Promise<ProductListResponse> {
  const { data } = await api.get<ProductListResponse>('/api/v1/products', { params });
  return data;
}

export async function getProduct(identifier: string): Promise<StoreProduct | null> {
  try {
    const { data } = await api.get<StoreProduct>(`/api/v1/products/${encodeURIComponent(identifier)}`);
    return data;
  } catch (error: unknown) {
    const status = typeof error === 'object' && error && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined;
    if (status === 404) return null;
    throw error;
  }
}
