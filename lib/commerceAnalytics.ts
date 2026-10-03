import { externalBaseURL } from '@/lib/axios';

export type CommerceEventMetadata = {
  productId?: string;
  categorySlug?: string;
  country?: 'CN' | 'US' | 'TR' | 'IT' | 'GB';
  audience?: 'all' | 'women' | 'men' | 'kids';
  queryLength?: number;
  resultCount?: number;
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc';
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  quantity?: number;
};

export type CommerceEventName =
  | 'page_view'
  | 'product_view'
  | 'catalog_search'
  | 'catalog_filter'
  | 'favorite_add'
  | 'favorite_remove'
  | 'compare_add'
  | 'compare_remove'
  | 'cart_add'
  | 'cart_remove'
  | 'begin_checkout'
  | 'promo_apply'
  | 'promo_reject'
  | 'purchase'
  | 'review_submit'
  | 'outfit_save'
  | 'outfit_add_to_cart'
  | 'wishlist_share_enable'
  | 'wishlist_share_open'
  | 'wishlist_share_disable'
  | 'telegram_transition';

type CommerceEvent =
  | { eventName: Exclude<CommerceEventName, 'purchase'>; metadata?: CommerceEventMetadata }
  | { eventName: 'purchase'; orderId: string; metadata?: CommerceEventMetadata };

const recentEvents = new Map<string, number>();
const EVENT_DEDUPE_MS = 2_000;

function getDeviceId() {
  let deviceId = localStorage.getItem('averon_device_id');
  if (!deviceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceId)) {
    deviceId = window.crypto.randomUUID();
    localStorage.setItem('averon_device_id', deviceId);
  }
  return deviceId;
}

export function trackCommerceEvent(event: CommerceEvent, pathOverride?: string) {
  if (typeof window === 'undefined') return;
  const path = pathOverride ?? window.location.pathname;
  const dedupeKey = JSON.stringify([event.eventName, path, event.metadata ?? {}, 'orderId' in event ? event.orderId : null]);
  const now = Date.now();
  for (const [key, time] of recentEvents) {
    if (now - time > EVENT_DEDUPE_MS) recentEvents.delete(key);
  }
  if ((recentEvents.get(dedupeKey) ?? 0) > now - EVENT_DEDUPE_MS) return;
  recentEvents.set(dedupeKey, now);
  if (recentEvents.size > 1000) {
    const oldestEvent = recentEvents.keys().next().value;
    if (oldestEvent) recentEvents.delete(oldestEvent);
  }

  try {
    const payload = {
      eventId: window.crypto.randomUUID(),
      deviceId: getDeviceId(),
      eventName: event.eventName,
      path,
      ...(event.metadata ? { metadata: event.metadata } : {}),
      ...('orderId' in event ? { orderId: event.orderId } : {}),
    };
    void fetch(`${externalBaseURL}/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Analytics storage and network access are optional.
  }
}
