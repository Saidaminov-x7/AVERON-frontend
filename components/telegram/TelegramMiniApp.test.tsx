import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramMiniApp } from './TelegramMiniApp';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  auth: {
    isAuthenticated: false,
    isLoading: false,
    setAuth: vi.fn(),
  },
}));

vi.mock('@/lib/axios', () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: typeof mocks.auth) => unknown) => selector ? selector(mocks.auth) : mocks.auth,
}));
vi.mock('@/components/commerce/AddToCart', () => ({
  AddToCart: () => <div data-testid="add-to-cart" />,
}));
vi.mock('@/components/commerce/ProductGallery', () => ({
  ProductGallery: () => <div data-testid="product-gallery" />,
}));
vi.mock('@/components/commerce/ProductImage', () => ({
  ProductImage: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));
vi.mock('@/components/commerce/ProductReviews', () => ({
  ProductReviews: () => <div data-testid="product-reviews" />,
}));

const product = {
  id: 'internal-id',
  slug: 'blue-shirt',
  translations: { en: { title: 'Blue shirt' } },
  salePriceUzs: 120000,
  available: false,
  stock: 0,
  availability: { inStock: false, preorderEligible: false, preorderAvailable: 0, estimatedAvailableAt: null },
  images: [],
  variants: [],
};

function renderMiniApp(initialProduct?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TelegramMiniApp locale="en" initialProduct={initialProduct} />
    </QueryClientProvider>,
  );
}

describe('TelegramMiniApp', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.auth.isAuthenticated = false;
    mocks.auth.isLoading = false;
    mocks.auth.setAuth.mockReset();
    delete (window as Window & { Telegram?: unknown }).Telegram;
  });

  it('resolves a safe public product slug through the published catalog API', async () => {
    mocks.get.mockResolvedValue({ data: product });
    renderMiniApp('blue-shirt');

    expect(await screen.findByRole('heading', { name: 'Blue shirt' })).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith('/api/v1/products/blue-shirt');
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-cart')).toBeInTheDocument();
  });

  it('does not use malformed deep-link identifiers to query a product', async () => {
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } } });
    renderMiniApp('../private');

    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/api/v1/products', { params: { page: 1, limit: 24 } }));
    expect(mocks.get).not.toHaveBeenCalledWith(expect.stringContaining('private'));
  });

  it('shows unavailable for a valid but unpublished or unknown product slug', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } });
    renderMiniApp('not-published');

    expect(await screen.findByText('Product not found or no longer available.')).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith('/api/v1/products/not-published');
  });

  it('accepts only a validated API identity before establishing Mini App auth', async () => {
    (window as Window & { Telegram?: unknown }).Telegram = {
      WebApp: { initData: 'signed-init-data', ready: vi.fn(), expand: vi.fn() },
    };
    mocks.post.mockResolvedValue({
      data: {
        linked: true,
        accessToken: 'session-token',
        user: { id: 'user-id', name: 'Customer', role: 'USER' },
      },
    });
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } } });
    renderMiniApp();

    await waitFor(() => expect(mocks.auth.setAuth).toHaveBeenCalledWith(
      { id: 'user-id', name: 'Customer', role: 'USER' },
      'session-token',
    ));
    expect(mocks.post).toHaveBeenCalledWith('/auth/telegram/mini-app/auth', { initData: 'signed-init-data' });
  });

  it('requires an explicit customer action before linking an authenticated account', async () => {
    mocks.auth.isAuthenticated = true;
    (window as Window & { Telegram?: unknown }).Telegram = {
      WebApp: { initData: 'signed-init-data' },
    };
    mocks.post
      .mockResolvedValueOnce({ data: { linked: false, telegramUser: { id: '123' } } })
      .mockResolvedValueOnce({ data: { linked: true } });
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } } });
    renderMiniApp();

    const linkButton = await screen.findByRole('button', { name: 'Link Telegram' });
    expect(mocks.post).toHaveBeenCalledTimes(1);
    fireEvent.click(linkButton);
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2));
    expect(mocks.post).toHaveBeenLastCalledWith('/auth/telegram/mini-app/link', { initData: 'signed-init-data' });
    expect(await screen.findByText('Telegram is linked to your AVERON account.')).toBeInTheDocument();
  });
});
