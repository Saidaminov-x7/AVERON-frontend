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
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  variantSnapshot?: { color: string | null; size: string | null; sku: string } | null;
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
}

export const commerceQueryKeys = {
  cart: ['commerce', 'cart'] as const,
  orders: ['commerce', 'orders'] as const,
  order: (orderNumber: string) => ['commerce', 'orders', orderNumber] as const,
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
}): Promise<CustomerOrder> {
  const { idempotencyKey, ...body } = input;
  const { data } = await api.post<CustomerOrder>('/api/v1/checkout', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
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

export function getCommerceErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const response = (error as { response?: { data?: unknown } }).response;
  if (!response?.data || typeof response.data !== 'object' || !('code' in response.data)) return null;
  const { code } = response.data as { code?: unknown };
  return typeof code === 'string' ? code : null;
}
