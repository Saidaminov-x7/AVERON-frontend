import api from './axios';
type Translation = { title?: string; name?: string } | string;
type LocalizedName = string | Record<string, string | undefined>;
type StoreLocale = 'ru' | 'uz' | 'en';

export type StoreCategory = {
  slug: string;
  name?: LocalizedName;
  translations?: Record<string, Translation>;
  nameRu?: string;
  nameUz?: string;
  nameEn?: string;
  active?: boolean;
};

export type StoreProduct = {
  id: string;
  slug: string;
  publicId?: string | null;
  sizeChartType?: 'CLOTHING' | 'SHOES' | 'KIDS_CLOTHING' | null;
  source?: string | null;
  sourceUrl?: string | null;
  translations?: Record<string, Translation>;
  description?: Record<string, string | { text?: string }> | null;
  salePriceUzs: string | number;
  compareAtPriceUzs?: string | number | null;
  stock?: number;
  available?: boolean;
  availability?: {
    inStock: boolean;
    preorderEligible: boolean;
    preorderAvailable: number;
    estimatedAvailableAt: string | null;
  };
  recommendationAvailability?: {
    available: boolean;
    preorder: boolean;
  };
  country?: string | null;
  images?: Array<{ id?: string; url: string; alt?: Record<string, string> }>;
  category?: StoreCategory | null;
  material?: string | null;
  attributes?: Record<string, unknown> | null;
  variants?: Array<{
    id: string;
    color?: string | null;
    size?: string | null;
    stock?: number;
    available?: boolean;
    salePriceUzs?: string | number;
  }>;
};

export function productRouteId(product: Pick<StoreProduct, 'publicId' | 'slug'>) {
  return product.publicId || product.slug;
}

export function productPlainText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__|~~|[*_`])/g, '')
    .replace(/^\s{0,3}(#{1,6}\s|>\s|[-*+]\s|\d+\.\s)/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function productTitle(product: StoreProduct, locale = 'ru') {
  const value = product.translations?.[locale]
    ?? (locale === 'ru' ? product.translations?.ru : undefined);
  const title = typeof value === 'string' ? value : value?.title ?? value?.name;
  if (title && (locale === 'ru' || !/\p{Script=Cyrillic}/u.test(title))) return title;
  return product.slug.replaceAll('-', ' ');
}

export function categoryName(category: StoreCategory, locale = 'ru') {
  const locales: StoreLocale[] = ['ru', 'uz', 'en'];
  const fallbackLocales = [locale, ...locales.filter((item) => item !== locale)];

  for (const candidate of fallbackLocales) {
    const localizedName = category.name && typeof category.name === 'object'
      ? category.name[candidate]
      : undefined;
    const translation = category.translations?.[candidate];
    const translatedName = typeof translation === 'string'
      ? translation
      : translation?.name ?? translation?.title;
    const namedField = candidate === 'ru'
      ? category.nameRu
      : candidate === 'uz'
        ? category.nameUz
        : category.nameEn;
    const value = localizedName || translatedName || namedField;
    if (value) return value;
  }

  return (typeof category.name === 'string' ? category.name : undefined)
    ?? category.slug.replaceAll('-', ' ');
}

export function parseStoreCategories(data: unknown): StoreCategory[] {
  let categories: unknown = data;

  for (let depth = 0; depth < 3 && !Array.isArray(categories); depth += 1) {
    if (typeof categories !== 'object' || categories === null) return [];
    const response = categories as Record<string, unknown>;
    categories = Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.categories)
        ? response.categories
        : response.data;
  }

  if (!Array.isArray(categories)) return [];

  return categories.filter(
    (category): category is StoreCategory =>
      typeof category === 'object' &&
      category !== null &&
      'slug' in category &&
      typeof category.slug === 'string' &&
      'active' in category &&
      category.active === true,
  );
}

export interface ProductListResponse {
  items: StoreProduct[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function buildCatalogSearchParams(filters: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const key of ['q', 'country', 'category', 'audience', 'size', 'color', 'minPrice', 'maxPrice', 'sort', 'page']) {
    const value = filters[key];
    if (typeof value === 'string' && (value.trim() || (key === 'country' && value === ''))) {
      query.set(key, value.trim());
    }
  }
  return query;
}

export function buildProductSearchParams(filters: Record<string, string | string[] | undefined>, limit = 24) {
  const query = buildCatalogSearchParams(filters);
  query.set('limit', String(limit));
  return query;
}

export function buildCatalogPageSearchParams(
  filters: Record<string, string | string[] | undefined>,
  page: number,
) {
  const query = buildCatalogSearchParams(filters);
  if (page > 1) query.set('page', String(page));
  else query.delete('page');
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
