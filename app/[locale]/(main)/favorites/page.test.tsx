import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FavoritesPage from './page';

const mocks = vi.hoisted(() => ({
  wishlist: { items: [], sharingEnabled: false, sharePath: null as string | null },
  getWishlist: vi.fn(),
  enable: vi.fn(),
  regenerate: vi.fn(),
  disable: vi.fn(),
  writeText: vi.fn(),
  track: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'en' }) }));
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href as string} {...props}>{children}</a> }));
vi.mock('@/components/ProtectedRoute', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/commerce/ProductCard', () => ({ ProductCard: () => null }));
vi.mock('@/lib/products', () => ({ getProduct: vi.fn(async () => null) }));
vi.mock('@/store/useFavoritesStore', () => ({ useFavoritesStore: (selector: (state: { ids: string[] }) => unknown) => selector({ ids: [] }) }));
vi.mock('@/lib/commerce-orders', () => ({
  commerceQueryKeys: { wishlist: ['commerce', 'wishlist'] },
  getWishlist: () => mocks.getWishlist(),
  enableWishlistSharing: () => mocks.enable(),
  regenerateWishlistShare: () => mocks.regenerate(),
  disableWishlistSharing: () => mocks.disable(),
}));
vi.mock('@/lib/commerceAnalytics', () => ({ trackCommerceEvent: (...args: unknown[]) => mocks.track(...args) }));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><FavoritesPage /></QueryClientProvider>);
}

describe('favorites public sharing controls', () => {
  beforeEach(() => {
    mocks.wishlist = { items: [], sharingEnabled: false, sharePath: null };
    mocks.getWishlist.mockReset().mockImplementation(async () => mocks.wishlist);
    mocks.enable.mockReset().mockImplementation(async () => {
      mocks.wishlist = { ...mocks.wishlist, sharingEnabled: true, sharePath: '/wishlists/shared/first-token' };
      return { enabled: true, sharePath: mocks.wishlist.sharePath! };
    });
    mocks.regenerate.mockReset().mockImplementation(async () => {
      mocks.wishlist = { ...mocks.wishlist, sharingEnabled: true, sharePath: '/wishlists/shared/rotated-token' };
      return { enabled: true, sharePath: mocks.wishlist.sharePath! };
    });
    mocks.disable.mockReset().mockImplementation(async () => {
      mocks.wishlist = { ...mocks.wishlist, sharingEnabled: false, sharePath: null };
    });
    mocks.writeText.mockReset().mockResolvedValue(undefined);
    mocks.track.mockReset();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: mocks.writeText } });
  });

  it('enables sharing, copies the active URL, rotates it, and revokes access', async () => {
    renderPage();
    const enable = await screen.findByRole('button', { name: 'Enable link sharing' });
    fireEvent.click(enable);

    const copy = await screen.findByRole('button', { name: 'Copy share link' });
    expect(mocks.enable).toHaveBeenCalledTimes(1);
    fireEvent.click(copy);
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith(new URL('/en/wishlist/shared/first-token', window.location.origin).toString()));
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied.');

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate link' }));
    await waitFor(() => expect(mocks.regenerate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.getWishlist).toHaveBeenCalledTimes(3));
    fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenLastCalledWith(new URL('/en/wishlist/shared/rotated-token', window.location.origin).toString()));

    fireEvent.click(screen.getByRole('button', { name: 'Disable sharing' }));
    await waitFor(() => expect(mocks.disable).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'Enable link sharing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy share link' })).not.toBeInTheDocument();
    expect(mocks.track).toHaveBeenCalledWith({ eventName: 'wishlist_share_enable' });
    expect(mocks.track).toHaveBeenCalledWith({ eventName: 'wishlist_share_disable' });
  });

  it('shows a localized failure when enabling sharing is rejected', async () => {
    mocks.enable.mockRejectedValueOnce(new Error('request failed'));
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Enable link sharing' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Could not update sharing settings.');
    expect(screen.queryByRole('button', { name: 'Copy share link' })).not.toBeInTheDocument();
  });
});
