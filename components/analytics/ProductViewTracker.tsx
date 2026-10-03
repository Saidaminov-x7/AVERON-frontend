'use client';

import { useEffect } from 'react';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackCommerceEvent({ eventName: 'product_view', metadata: { productId } });
  }, [productId]);

  return null;
}
