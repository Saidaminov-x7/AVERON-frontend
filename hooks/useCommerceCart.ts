'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import {
  addCartItem,
  clearCart,
  commerceQueryKeys,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/commerce-orders';
import { trackCommerceEvent } from '@/lib/commerceAnalytics';

export function useCommerceCart() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const query = useQuery({
    queryKey: commerceQueryKeys.cart,
    queryFn: getCart,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (
      action:
        | { type: 'add'; productId: string; variantId?: string; quantity: number }
        | { type: 'update'; itemId: string; quantity: number }
        | { type: 'remove'; itemId: string }
        | { type: 'clear' },
    ) => {
      if (action.type === 'add') {
        return addCartItem({
          productId: action.productId,
          variantId: action.variantId,
          quantity: action.quantity,
        });
      }
      if (action.type === 'update') return updateCartItem(action.itemId, action.quantity);
      if (action.type === 'remove') return removeCartItem(action.itemId);
      return clearCart();
    },
    onSuccess: (cart, action) => {
      queryClient.setQueryData(commerceQueryKeys.cart, cart);
      if (action.type === 'add') {
        trackCommerceEvent({
          eventName: 'cart_add',
          metadata: { productId: action.productId, quantity: action.quantity },
        });
      } else if (action.type === 'remove') {
        trackCommerceEvent({ eventName: 'cart_remove' });
      }
    },
  });

  return {
    ...query,
    mutation,
    isMutating: mutation.isPending,
  };
}
