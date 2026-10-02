import api from './axios';

export interface CartVariant {
  color: string | null;
  size: string | null;
  sku: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  title: string;
  imageUrl: string | null;
  variant: CartVariant | null;
  quantity: number;
  stock: number;
  preorderEligible?: boolean;
  preorderAvailable?: number;
  estimatedAvailableAt?: string | null;
  fulfillmentType?: 'STOCK' | 'PREORDER' | null;
  available: boolean;
  availabilityCode?: string;
  unitPriceUzs: string;
  lineTotalUzs: string;
}

export interface Cart {
  items: CartItem[];
  subtotalUzs: string;
  currency: 'UZS';
}

export interface DeliveryDetails {
  city: string;
  address: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  comment?: string;
}

export interface OrderContact {
  name: string;
  phone: string;
}

export interface OrderItem {
  title: string;
  productSlug?: string;
  reviewEligible?: boolean;
  reviewToken?: string;
  reviewStatus?: 'PENDING' | 'PUBLISHED' | 'REJECTED' | null;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  variantSnapshot?: { color: string | null; size: string | null; sku: string } | null;
  isPreorder?: boolean;
  estimatedAvailableAt?: string | null;
}

export interface OrderStatusHistoryEntry {
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface OrderShipment {
  provider?: string | null;
  trackingNumber?: string | null;
  status?: string | null;
  sentAt: string | null;
  arrivedAt: string | null;
}

export interface OrderDeliveryHistoryEntry {
  status: string;
  createdAt: string;
}

export interface OrderDelivery {
  method: 'COURIER' | 'PICKUP';
  recipient: string;
  phone: string;
  destination: DeliveryDetails;
  status: string;
  trackingNumber: string | null;
  provider: string | null;
  estimatedDeliveryAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  history: OrderDeliveryHistoryEntry[];
}

export interface CustomerOrder {
  id?: string;
  orderNumber: string;
  status: string;
  currency: 'UZS';
  subtotal: string | number;
  discount: string | number;
  deliveryCost: string | number;
  totalRevenue: string | number;
  contact?: OrderContact;
  deliveryAddress?: DeliveryDetails;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  shipments?: OrderShipment[];
  delivery?: OrderDelivery | null;
}

export interface OutfitItemDto {
  productId: string;
  variantId: string | null;
  sortOrder?: number;
  product: {
    slug: string;
    title: string;
    imageUrl: string | null;
    priceUzs: string;
    stock: number;
    preorderAvailable: boolean;
    variant: { id: string; color: string | null; size: string | null } | null;
  };
}

export interface SavedOutfit {
  id: string;
  name: string;
  updatedAt?: string;
  items: OutfitItemDto[];
  totalUzs?: string;
}

export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  priceUzs: string;
  available: boolean;
}

export const commerceQueryKeys = {
  cart: ['commerce', 'cart'] as const,
  orders: ['commerce', 'orders'] as const,
  order: (orderNumber: string) => ['commerce', 'orders', orderNumber] as const,
  outfits: ['commerce', 'outfits'] as const,
  wishlist: ['commerce', 'wishlist'] as const,
};

export async function getCart(): Promise<Cart> {
  const { data } = await api.get<Cart>('/api/v1/cart');
  return data;
}

export async function addCartItem(input: {
  productId: string;
  variantId?: string;
  quantity: number;
}): Promise<Cart> {
  const { data } = await api.post<Cart>('/api/v1/cart/items', input);
  return data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`, { quantity });
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/api/v1/cart/items/${encodeURIComponent(itemId)}`);
  return data;
}

export async function clearCart(): Promise<Cart> {
  const { data } = await api.delete<Cart>('/api/v1/cart');
  return data;
}

export async function createCheckout(input: {
  contact: OrderContact;
  deliveryAddress: DeliveryDetails;
  idempotencyKey: string;
  promoCode?: string;
}): Promise<CustomerOrder> {
  const { idempotencyKey, ...body } = input;
  const { data } = await api.post<CustomerOrder>('/api/v1/checkout', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data;
}

export async function getSavedOutfits(): Promise<SavedOutfit[]> {
  const { data } = await api.get<SavedOutfit[]>('/api/v1/outfits');
  return data;
}

export async function saveOutfit(input: { name: string; items: Array<{ productId: string; variantId?: string | null }> }) {
  const { data } = await api.post<SavedOutfit>('/api/v1/outfits', input);
  return data;
}

export async function updateOutfit(id: string, input: { name?: string; items?: Array<{ productId: string; variantId?: string | null }> }) {
  const { data } = await api.patch<SavedOutfit>(`/api/v1/outfits/${encodeURIComponent(id)}`, input);
  return data;
}

export async function deleteOutfit(id: string) {
  await api.delete(`/api/v1/outfits/${encodeURIComponent(id)}`);
}

export async function addOutfitToCart(id: string): Promise<{
  addedProductIds: string[];
  rejectedItems: Array<{ productId: string; variantId: string | null; code: string }>;
  message: string;
}> {
  const { data } = await api.post(`/api/v1/outfits/${encodeURIComponent(id)}/cart`);
  return data;
}

export async function getWishlist(): Promise<{ items: WishlistItem[]; sharingEnabled: boolean; sharePath: string | null }> {
  const { data } = await api.get('/api/v1/wishlist');
  return data;
}

export async function addWishlistItem(productId: string) {
  await api.post(`/api/v1/wishlist/${encodeURIComponent(productId)}`);
}

export async function removeWishlistItem(productId: string) {
  await api.delete(`/api/v1/wishlist/${encodeURIComponent(productId)}`);
}

export async function enableWishlistSharing(): Promise<{ enabled: boolean; sharePath: string }> {
  const { data } = await api.post('/api/v1/wishlist/sharing');
  return data;
}

export async function regenerateWishlistShare(): Promise<{ enabled: boolean; sharePath: string }> {
  const { data } = await api.post('/api/v1/wishlist/sharing/regenerate');
  return data;
}

export async function disableWishlistSharing() {
  await api.delete('/api/v1/wishlist/sharing');
}

export async function getSharedWishlist(token: string): Promise<{ items: WishlistItem[] }> {
  const { data } = await api.get(`/api/v1/wishlists/shared/${encodeURIComponent(token)}`);
  return data;
}

export async function validatePromoCode(code: string): Promise<{ valid: true; code: string; discountPercent: number; consumed: false }> {
  const { data } = await api.post('/api/v1/promo-codes/validate', { code });
  return data;
}

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  const { data } = await api.get<CustomerOrder[]>('/api/v1/orders/me');
  return data;
}

export async function getCustomerOrder(orderNumber: string): Promise<CustomerOrder> {
  const { data } = await api.get<CustomerOrder>(
    `/api/v1/orders/me/${encodeURIComponent(orderNumber)}`,
  );
  return data;
}

export async function cancelCustomerOrder(orderNumber: string): Promise<CustomerOrder> {
  const { data } = await api.post<CustomerOrder>(
    `/api/v1/orders/me/${encodeURIComponent(orderNumber)}/cancel`,
  );
  return data;
}

export function getCommerceErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const response = (error as { response?: { data?: unknown } }).response;
  if (!response?.data || typeof response.data !== 'object' || !('code' in response.data)) return null;
  const { code } = response.data as { code?: unknown };
  return typeof code === 'string' ? code : null;
}
