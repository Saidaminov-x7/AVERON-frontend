import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddToCart } from './AddToCart';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  authenticated: true,
  mutationError: null as unknown,
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/catalog/product-1',
  useSearchParams: () => mocks.params,
  useRouter: () => ({ push: vi.fn(), replace: mocks.replace }),
}));
vi.mock('@/hooks/useCommerceCart', () => ({
  useCommerceCart: () => ({
    mutation: { mutate: mocks.mutate, isPending: false, isError: Boolean(mocks.mutationError), error: mocks.mutationError },
  }),
}));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ isAuthenticated: mocks.authenticated, isLoading: false }),
}));

describe('AddToCart availability', () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.replace.mockReset();
    mocks.params = new URLSearchParams();
    mocks.authenticated = true;
    mocks.mutationError = null;
    sessionStorage.clear();
  });

  it('does not invent an out-of-stock state when backend availability is unknown', () => {
    render(<AddToCart productId="product-1" productPrice="125000" variants={[]} />);

    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
    expect(screen.queryByText('Available to order')).not.toBeInTheDocument();
  });

  it('shows a real markdown price without replacing the current price', () => {
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        productCompareAtPrice="200000"
        variants={[]}
      />,
    );

    expect(screen.getByText('125,000 UZS')).toBeInTheDocument();
    expect(screen.getByText('200,000 UZS')).toHaveAttribute('class', expect.stringContaining('text-[var(--color-muted)]'));
    expect(screen.getByText('38% off')).toBeInTheDocument();
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

  it('explains the server cart-line limit instead of showing a generic add failure', () => {
    mocks.mutationError = { response: { data: { code: 'CART_ITEM_LIMIT' } } };
    render(<AddToCart productId="product-1" productPrice="125000" variants={[]} />);

    expect(screen.getByText('Your cart already has the maximum number of different items.')).toBeInTheDocument();
  });

  it('shows the same in-stock label for any known positive stock quantity', () => {
    const { rerender } = render(
      <AddToCart productId="product-1" productPrice="125000" productStock={5} variants={[]} />,
    );
    expect(screen.getByText('In stock', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/In stock:/)).not.toBeInTheDocument();

    rerender(<AddToCart productId="product-1" productPrice="125000" productStock={6} variants={[]} />);
    expect(screen.queryByText(/Low stock/)).not.toBeInTheDocument();
  });

  it('requires explicit size and color selection and shows per-variant availability', () => {
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[
          { id: 'variant-1', color: 'Blue', size: 'M', stock: 6, salePriceUzs: '125000' },
          { id: 'variant-2', color: 'Blue', size: 'L', stock: 4, salePriceUzs: '125000' },
          { id: 'variant-3', color: 'Red', size: 'M', stock: 0, available: false, salePriceUzs: '130000' },
        ]}
      />,
    );

    expect(screen.getByText('125,000 UZS')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Choose an option' }).querySelectorAll('legend')[0]).toHaveTextContent('Size: Choose');
    expect(screen.getByRole('group', { name: 'Choose an option' }).querySelectorAll('legend')[1]).toHaveTextContent('Color: Choose');
    expect(screen.queryByText('In stock', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Size: L, Available to order' }));
    expect(screen.getByRole('group', { name: 'Choose an option' }).querySelectorAll('legend')[1]).toHaveTextContent('Color: Choose');
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Color: Blue, Available to order' }));
    expect(screen.getByText('In stock', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Size: L, Available to order' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Size: M, Available to order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Color: Red, Out of stock' }));
    expect(screen.getByText('Out of stock', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Out of stock' })).toBeDisabled();
    expect(screen.getByText('130,000 UZS')).toBeInTheDocument();
  });

  it('offers login and registration with the selected SKU and quantity carried through returnTo', () => {
    mocks.authenticated = false;
    render(<AddToCart productId="product-1" productPrice="125000" variants={[{ id: 'variant-1', size: 'M', stock: 8 }]} />);

    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Size: M, Available to order' }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    expect(screen.getByRole('dialog', { name: 'Sign in to continue' })).toBeInTheDocument();
    const login = screen.getByRole('link', { name: 'Sign in' });
    const register = screen.getByRole('link', { name: 'Create account' });
    const loginReturnTo = new URL(login.getAttribute('href')!, 'https://averon.test').searchParams.get('returnTo');
    const registerReturnTo = new URL(register.getAttribute('href')!, 'https://averon.test').searchParams.get('returnTo');
    expect(loginReturnTo).toBe(registerReturnTo);
    const intent = new URL(loginReturnTo!, 'https://averon.test');
    expect(intent.pathname).toBe('/en/catalog/product-1');
    expect(intent.searchParams.get('addToCart')).toBe('1');
    expect(intent.searchParams.get('cartVariant')).toBe('variant-1');
    expect(intent.searchParams.get('cartQuantity')).toBe('1');
  });

  it('still requires an explicit click when a product has only one color', () => {
    render(<AddToCart productId="product-1" productPrice="125000" variants={[
      { id: 'variant-1', size: 'M', color: 'Red::#ff0000', stock: 8 },
    ]} />);

    expect(screen.getByRole('button', { name: 'Color: Red, Available to order' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Size: M, Available to order' }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Color: Red, Available to order' }));
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
  });

  it('adds a pending product intent once when the user returns authenticated', async () => {
    mocks.params = new URLSearchParams('addToCart=1&cartVariant=variant-1&cartQuantity=2');
    sessionStorage.setItem('averon:pending-cart-intent', JSON.stringify({
      productId: 'product-1',
      destination: '/en/catalog/product-1?addToCart=1&cartVariant=variant-1&cartQuantity=2',
    }));
    render(<AddToCart productId="product-1" productPrice="125000" variants={[{ id: 'variant-1', size: 'M', stock: 8 }]} />);

    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).toHaveBeenCalledWith(
      { type: 'add', productId: 'product-1', variantId: 'variant-1', quantity: 2 },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    const options = mocks.mutate.mock.calls[0][1];
    options.onSuccess();
    expect(mocks.replace).toHaveBeenCalledWith('/en/catalog/product-1', { scroll: false });
    expect(sessionStorage.getItem('averon:pending-cart-intent')).toBeNull();
  });

  it('does not mutate the cart from an untrusted copied URL intent', () => {
    mocks.params = new URLSearchParams('addToCart=1&cartVariant=variant-1&cartQuantity=2');
    render(<AddToCart productId="product-1" productPrice="125000" variants={[{ id: 'variant-1', size: 'M', stock: 8 }]} />);

    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('does not silently add a different SKU when the requested variant is unavailable', () => {
    mocks.params = new URLSearchParams('addToCart=1&cartVariant=variant-out-of-stock&cartQuantity=2');
    sessionStorage.setItem('averon:pending-cart-intent', JSON.stringify({
      productId: 'product-1',
      destination: '/en/catalog/product-1?addToCart=1&cartVariant=variant-out-of-stock&cartQuantity=2',
    }));
    render(<AddToCart productId="product-1" productPrice="125000" variants={[
      { id: 'variant-1', size: 'M', stock: 8 },
      { id: 'variant-out-of-stock', size: 'L', stock: 0, available: false },
    ]} />);

    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('averon:pending-cart-intent')).not.toBeNull();
  });
});
