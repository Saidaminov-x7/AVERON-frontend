import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddToCart } from './AddToCart';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/catalog/product-1',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/hooks/useCommerceCart', () => ({
  useCommerceCart: () => ({
    mutation: { mutate: mocks.mutate, isPending: false, isError: false, error: null },
  }),
}));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ isAuthenticated: true, isLoading: false }),
}));

describe('AddToCart availability', () => {
  beforeEach(() => mocks.mutate.mockReset());

  it('does not invent an out-of-stock state when backend availability is unknown', () => {
    render(<AddToCart productId="product-1" productPrice="125000" variants={[]} />);

    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
    expect(screen.queryByText('Available to order')).not.toBeInTheDocument();
  });

  it('shows only the backend-provided availability flag', () => {
    const { rerender } = render(
      <AddToCart productId="product-1" productPrice="125000" productAvailable={true} variants={[]} />,
    );
    expect(screen.getByText('Available to order')).toBeInTheDocument();

    rerender(
      <AddToCart productId="product-1" productPrice="125000" productAvailable={false} variants={[]} />,
    );
    expect(screen.getByText('Out of stock', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
  });

  it('localizes low-stock messaging only for known positive stock at or below the threshold', () => {
    const { rerender } = render(
      <AddToCart productId="product-1" productPrice="125000" productStock={5} variants={[]} />,
    );
    expect(screen.getByText('Low stock: 5 left.')).toBeInTheDocument();

    rerender(<AddToCart productId="product-1" productPrice="125000" productStock={6} variants={[]} />);
    expect(screen.getByText('In stock: 6')).toBeInTheDocument();
    expect(screen.queryByText(/Low stock/)).not.toBeInTheDocument();
  });

  it('uses the selected backend variant price and availability for adding to cart', () => {
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[
          { id: 'variant-1', color: 'Blue', size: 'M', stock: 6, salePriceUzs: '125000' },
          { id: 'variant-2', color: 'Red', size: 'M', stock: 0, available: false, salePriceUzs: '130000' },
        ]}
      />,
    );

    expect(screen.getByText('In stock: 6')).toBeInTheDocument();
    expect(screen.getByText('125,000 UZS')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox', { name: 'Choose an option' }));
    expect(screen.getByRole('option', { name: 'Red · M · Out of stock' })).toBeDisabled();
  });
});
