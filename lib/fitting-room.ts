import api from './axios';

export type FittingLayer = 'BASE_TOP' | 'MID_LAYER' | 'OUTERWEAR' | 'BOTTOM' | 'FOOTWEAR' | 'ACCESSORY';
export const MIN_FITTING_ROTATION = -Math.PI / 3;
export const MAX_FITTING_ROTATION = Math.PI / 3;

export function clampFittingRotation(value: number) {
  return Math.max(MIN_FITTING_ROTATION, Math.min(MAX_FITTING_ROTATION, value));
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

