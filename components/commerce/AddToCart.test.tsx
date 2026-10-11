import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddToCart } from './AddToCart';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  isAuthenticated: true,
  pathname: '/en/catalog/product-1',
  search: '',
}));

vi.mock('next-intl', () => ({ useLocale: () => 'en' }));
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => new URLSearchParams(mocks.search),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/hooks/useCommerceCart', () => ({
  useCommerceCart: () => ({
    mutation: { mutate: mocks.mutate, isPending: false, isError: false, error: null },
  }),
}));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({ isAuthenticated: mocks.isAuthenticated, isLoading: false }),
}));

describe('AddToCart availability', () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.isAuthenticated = true;
    mocks.pathname = '/en/catalog/product-1';
    mocks.search = '';
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
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

  it('shows a concise in-stock status without exposing quantity on hand', () => {
    const { rerender } = render(
      <AddToCart productId="product-1" productPrice="125000" productStock={5} variants={[]} />,
    );
    expect(screen.getByText('In stock')).toBeInTheDocument();

    rerender(<AddToCart productId="product-1" productPrice="125000" productStock={6} variants={[]} />);
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.queryByText(/left|In stock:/i)).not.toBeInTheDocument();
  });

  it('renders sizes separately and updates variant availability when a color is selected', () => {
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[
          { id: 'variant-1', color: 'Blue', size: 'M', stock: 6, salePriceUzs: '125000' },
          { id: 'variant-2', color: 'Blue', size: 'L', stock: 4, salePriceUzs: '125000' },
          { id: 'variant-3', color: 'Red', size: 'M', stock: 0, available: false, salePriceUzs: '130000' },
          { id: 'variant-4', color: 'Red', size: 'L', stock: 2, salePriceUzs: '130000' },
        ]}
      />,
    );

    expect(screen.queryByText('In stock')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to cart' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'M, Available to order' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'M, Available to order' }));
    expect(screen.getByRole('button', { name: 'M, Available to order' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('In stock')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Color: blue.*Available to order/ }));
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.queryByText('Color: blue · Size: M')).not.toBeInTheDocument();
    expect(screen.getByText('125,000 UZS')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Size.*M/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Color.*blue/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'M, Available to order' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'L, Available to order' }));
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L, Available to order' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Color: red.*Available to order/ }));
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByText('130,000 UZS')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Color.*red/ })).toBeInTheDocument();
    expect(screen.queryByText('Color: red · Size: L')).not.toBeInTheDocument();
  });

  it('shows color names and swatches instead of hex values', () => {
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[
          { id: 'variant-1', color: 'Black::#000000', size: 'M', stock: 6 },
          { id: 'variant-2', color: 'Aqua::#00FFFF', size: 'M', stock: 4 },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'M, Available to order' }));
    fireEvent.click(screen.getByRole('button', { name: /Color: black.*Available to order/ }));
    expect(screen.getByRole('group', { name: /Size.*M/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Color.*black/ })).toBeInTheDocument();
    expect(screen.queryByText(/#000000/)).not.toBeInTheDocument();
    const blackOption = screen.getByRole('button', { name: /Color: black.*Available to order/ });
    expect(blackOption.querySelector('span[aria-hidden="true"]')).toHaveStyle({ backgroundColor: '#000000' });
    expect(blackOption).toHaveClass('ring-2', 'ring-offset-2');
  });

  it('keeps add-to-cart visible in the quantity row and opens the auth choices for guests', () => {
    mocks.isAuthenticated = false;
    render(<AddToCart productId="product-1" productPrice="125000" variants={[]} />);

    const addToCart = screen.getByRole('button', { name: 'Add to cart' });
    expect(addToCart).toHaveClass('w-full', 'h-11', 'min-w-0');
    expect(addToCart.parentElement).toHaveClass('grid-cols-[auto_minmax(0,1fr)]');
    fireEvent.click(addToCart);
    expect(screen.getByRole('heading', { name: 'Sign in or create an account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create account' })).toBeInTheDocument();
  });

  it('groups buy-now and an optional secondary action beneath the primary purchase row', () => {
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[]}
        secondaryAction={<button type="button">Try it on</button>}
      />,
    );

    const buyNow = screen.getByRole('button', { name: 'Buy now' });
    const tryOn = screen.getByRole('button', { name: 'Try it on' });
    expect(buyNow.parentElement).toBe(tryOn.parentElement);
    expect(buyNow.parentElement).toHaveClass('grid-cols-2');
  });

  it('returns from sign-in to the selected variant and quantity', () => {
    mocks.isAuthenticated = false;
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[
          { id: 'variant-blue-m', color: 'Blue', size: 'M', stock: 6 },
          { id: 'variant-blue-l', color: 'Blue', size: 'L', stock: 5 },
          { id: 'variant-red-m', color: 'Red', size: 'M', stock: 0, available: false },
          { id: 'variant-red-l', color: 'Red', size: 'L', stock: 4 },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'L, Available to order' }));
    fireEvent.click(screen.getByRole('button', { name: /Color: red.*Available to order/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }));
    const login = new URL(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')!, 'https://averon.test');
    expect(login.pathname).toBe('/en/login');
    expect(login.searchParams.get('returnTo')).toBe('/en/catalog/product-1?purchaseVariantId=variant-red-l&purchaseQuantity=3');
    fireEvent.click(screen.getByRole('link', { name: 'Create account' }));
    const register = new URL(screen.getByRole('link', { name: 'Create account' }).getAttribute('href')!, 'https://averon.test');
    expect(register.pathname).toBe('/en/register');
    expect(register.searchParams.get('returnTo')).toBe('/en/catalog/product-1?purchaseVariantId=variant-red-l&purchaseQuantity=3');
    const intent = JSON.parse(window.sessionStorage.getItem('averon:pending-product-cart-add:v1') ?? '{}');
    expect(intent).toMatchObject({ productId: 'product-1', variantId: 'variant-red-l', quantity: 3, returnTo: '/en/catalog/product-1?purchaseVariantId=variant-red-l&purchaseQuantity=3' });
  });

  it('adds the restored variant and quantity once after an authenticated return', async () => {
    mocks.isAuthenticated = false;
    const returnTo = '/en/catalog/product-1?purchaseVariantId=variant-red-l&purchaseQuantity=3';
    mocks.pathname = '/en/catalog/product-1';
    mocks.search = 'purchaseVariantId=variant-red-l&purchaseQuantity=3';
    window.history.replaceState({}, '', returnTo);
    window.sessionStorage.setItem('averon:pending-product-cart-add:v1', JSON.stringify({
      productId: 'product-1', variantId: 'variant-red-l', quantity: 3, returnTo, createdAt: Date.now(),
    }));
    const props = {
      productId: 'product-1', productPrice: '125000',
      variants: [
        { id: 'variant-blue-m', color: 'Blue', size: 'M', stock: 6 },
        { id: 'variant-red-l', color: 'Red', size: 'L', stock: 4 },
      ],
    };
    const { rerender } = render(<AddToCart {...props} />);
    mocks.isAuthenticated = true;
    rerender(<AddToCart {...props} />);

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { type: 'add', productId: 'product-1', variantId: 'variant-red-l', quantity: 3 },
      expect.objectContaining({ onSuccess: expect.any(Function), onSettled: expect.any(Function) }),
    );
    expect(window.sessionStorage.getItem('averon:pending-product-cart-add:v1')).toBeNull();
    rerender(<AddToCart {...props} />);
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    window.history.replaceState({}, '', '/');
  });

  it('restores a valid return variant and clamps quantity to its current stock', () => {
    mocks.isAuthenticated = false;
    mocks.search = 'purchaseVariantId=variant-red-l&purchaseQuantity=99';
    render(
      <AddToCart
        productId="product-1"
        productPrice="125000"
        variants={[
          { id: 'variant-blue-m', color: 'Blue', size: 'M', stock: 6 },
          { id: 'variant-red-l', color: 'Red', size: 'L', stock: 4 },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'L, Available to order' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('In stock')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity: 4')).toBeInTheDocument();
  });
});
