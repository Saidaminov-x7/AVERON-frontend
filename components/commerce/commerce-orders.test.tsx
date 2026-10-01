import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CartPage from '@/app/[locale]/(main)/cart/page';
import CheckoutPage from '@/app/[locale]/(main)/checkout/page';
import { CustomerOrderDetails } from './CustomerOrderDetails';
import { createCheckout, getCustomerOrder, type Cart } from '@/lib/commerce-orders';

const nav = vi.hoisted(() => ({ push: vi.fn() }));
const checkoutStore = vi.hoisted(() => ({ name: 'Test Customer', phone: '+998901234567' }));
const cartMock = vi.hoisted(() => ({
  data: null as Cart | null,
  isLoading: false,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
  mutation: { mutate: vi.fn(), isError: false, error: null as unknown, isPending: false },
  isMutating: false,
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('next/navigation', () => ({
  useRouter: () => nav,
  useParams: () => ({ orderNumber: 'AV-TEST-123' }),
}));
vi.mock('@/components/ProtectedRoute', () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/hooks/useCommerceCart', () => ({ useCommerceCart: () => cartMock }));
vi.mock('@/store/useAuthStore', () => ({ useAuthStore: () => ({ user: checkoutStore, isAuthenticated: true, isLoading: false }) }));
vi.mock('@/lib/commerce-orders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/commerce-orders')>();
  return {
    ...actual,
    createCheckout: vi.fn(),
    getCustomerOrder: vi.fn(),
  };
});

const sampleCart: Cart = {
  currency: 'UZS',
  subtotalUzs: '250000',
  items: [{
    id: 'line-1',
    productId: 'product-1',
    variantId: 'variant-1',
    title: 'Blue dress',
    imageUrl: null,
    variant: { color: 'Blue', size: 'M', sku: 'DRESS-M' },
    quantity: 2,
    stock: 8,
    available: true,
    unitPriceUzs: '125000',
    lineTotalUzs: '250000',
  }],
};

const sampleOrder = {
  orderNumber: 'AV-TEST-123',
  status: 'CREATED',
  currency: 'UZS' as const,
  subtotal: '250000',
  discount: '0',
  deliveryCost: '0',
  totalRevenue: '250000',
  items: [{ title: 'Blue dress', quantity: 2, unitPrice: '125000', totalPrice: '250000' }],
  createdAt: '2026-10-01T10:00:00.000Z',
};

function renderWithQueryClient(element: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customer commerce flows', () => {
  beforeEach(() => {
    nav.push.mockReset();
    cartMock.data = sampleCart;
    cartMock.isLoading = false;
    cartMock.isError = false;
    cartMock.error = null;
    cartMock.refetch.mockReset();
    cartMock.mutation = { mutate: vi.fn(), isError: false, error: null, isPending: false };
    cartMock.isMutating = false;
    vi.mocked(createCheckout).mockReset();
    vi.mocked(getCustomerOrder).mockReset();
  });

  it('shows server cart totals and sends a quantity mutation', () => {
    render(<CartPage />);

    expect(screen.getByText('Blue dress')).toBeInTheDocument();
    expect(screen.getAllByText('250,000 UZS')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Quantity: 2, increase' }));

    expect(cartMock.mutation.mutate).toHaveBeenCalledWith({
      type: 'update',
      itemId: 'line-1',
      quantity: 3,
    });
  });

  it('prevents checkout when a product became unavailable', () => {
    cartMock.data = {
      ...sampleCart,
      items: [{ ...sampleCart.items[0], available: false, stock: 0 }],
    };
    render(<CartPage />);

    expect(screen.getByRole('button', { name: /Continue to checkout/ })).toBeDisabled();
    expect(screen.getAllByText(/no longer available/).length).toBeGreaterThan(0);
  });

  it('submits customer-entered delivery details and keeps the idempotency key for an unchanged retry', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'stable-idempotency-key' });
    vi.mocked(createCheckout)
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce(sampleOrder);
    renderWithQueryClient(<CheckoutPage />);

    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Tashkent' } });
    fireEvent.change(screen.getByLabelText('Street and building'), { target: { value: 'Amir Temur 1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));
    await waitFor(() => expect(createCheckout).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/en/checkout/success/AV-TEST-123'));
    expect(createCheckout).toHaveBeenNthCalledWith(1, expect.objectContaining({
      contact: { name: 'Test Customer', phone: '+998901234567' },
      deliveryAddress: { city: 'Tashkent', address: 'Amir Temur 1' },
      idempotencyKey: 'stable-idempotency-key',
    }), expect.any(Object));
    expect(createCheckout).toHaveBeenNthCalledWith(2, expect.objectContaining({
      idempotencyKey: 'stable-idempotency-key',
    }), expect.any(Object));
  });

  it('shows the server-confirmed order total on refreshable order details', async () => {
    vi.mocked(getCustomerOrder).mockResolvedValue(sampleOrder);
    renderWithQueryClient(<CustomerOrderDetails success />);

    expect(await screen.findByText('Order placed')).toBeInTheDocument();
    expect(screen.getAllByText('250,000 UZS').length).toBeGreaterThan(1);
    expect(getCustomerOrder).toHaveBeenCalledWith('AV-TEST-123');
  });
});
