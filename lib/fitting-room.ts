import api from './axios';

export type FittingLayer = 'BASE_TOP' | 'MID_LAYER' | 'OUTERWEAR' | 'BOTTOM' | 'FOOTWEAR' | 'ACCESSORY';
export const MIN_FITTING_ROTATION = -Math.PI / 3;
export const MAX_FITTING_ROTATION = Math.PI / 3;

export function clampFittingRotation(value: number) {
  return Math.max(MIN_FITTING_ROTATION, Math.min(MAX_FITTING_ROTATION, value));
}

export function rotateFittingWithArrow(value: number, key: string) {
  if (key === 'ArrowLeft') return clampFittingRotation(value - 0.16);
  if (key === 'ArrowRight') return clampFittingRotation(value + 0.16);
  return value;
}

export type FittingAsset = {
  id: string;
  variantId: string | null;
  garmentLayer: FittingLayer;
  mannequinVersion: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  scale: number;
  url: string;
};

export function shouldFallbackToFittingPhoto(
  assets: readonly Pick<FittingAsset, 'mannequinVersion'>[],
  hasMissingGarment = false,
): boolean {
  return hasMissingGarment || assets.length === 0 || assets.some((asset) => asset.mannequinVersion !== 'averon-neutral-v1');
}

export function getFittingFallbackImageUrl(
  items: readonly { asset: Pick<FittingAsset, 'mannequinVersion'> | null; imageUrl: string | null }[],
  defaultImageUrl?: string | null,
) {
  return items.find((item) => !item.asset || item.asset.mannequinVersion !== 'averon-neutral-v1')?.imageUrl ?? defaultImageUrl ?? null;
}

export function getVariantFittingAsset<T extends Pick<FittingAsset, 'variantId'>>(
  assets: readonly T[],
  variantId: string | null,
): T | undefined {
  return assets.find((asset) => asset.variantId === variantId);
}

export type FittingProduct = {
  id: string;
  slug: string;
  title: string;
  salePriceUzs: string;
  imageUrl: string | null;
  variants: Array<{
    id: string;
    color: string | null;
    size: string | null;
    stock: number;
    salePriceUzs: string;
  }>;
  assets: FittingAsset[];
};

export async function getFittingProduct(identifier: string, locale = 'ru', signal?: AbortSignal): Promise<FittingProduct> {
  const { data } = await api.get<FittingProduct>(`/api/v1/products/${encodeURIComponent(identifier)}/fitting-room`, { params: { locale }, signal });
  return data;
}

export async function getFittingProducts(locale = 'ru', options: { q?: string; signal?: AbortSignal } = {}): Promise<FittingProduct[]> {
  const { data } = await api.get<FittingProduct[]>('/api/v1/fitting-room/products', { params: { limit: 48, locale, ...(options.q ? { q: options.q } : {}) }, signal: options.signal });
  return data;
}
