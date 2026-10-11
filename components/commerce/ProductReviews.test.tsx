import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enMessages from '@/messages/en.json';
import { ProductReviews } from './ProductReviews';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  auth: { isAuthenticated: false },
}));

vi.mock('@/lib/axios', () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch, delete: mocks.delete } }));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: typeof mocks.auth) => unknown) => selector ? selector(mocks.auth) : mocks.auth,
}));

function renderReviews() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <QueryClientProvider client={client}>
        <ProductReviews slug="blue-shirt" locale="en" />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe('ProductReviews', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.post.mockReset();
    mocks.patch.mockReset();
    mocks.delete.mockReset();
    mocks.auth.isAuthenticated = false;
    mocks.get.mockResolvedValue({
      data: {
        summary: {
          averageRating: 4.5,
          reviewCount: 2,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
          fitDistribution: { RUNS_SMALL: 0, TRUE_TO_SIZE: 100, RUNS_LARGE: 0 },
        },
        items: [{
          rating: 5,
          title: 'Great fit',
          comment: 'The fabric and fit are excellent.',
          verifiedPurchase: true,
          fitFeedback: 'TRUE_TO_SIZE',
          createdAt: '2026-09-30T10:00:00.000Z',
          author: { name: 'Alex Morgan', avatar: null },
          purchasedVariant: { size: 'M' },
          media: [],
        }],
        pagination: { page: 1, pages: 1 },
      },
    });
  });

  it('renders server aggregates, verified status, fit feedback, and purchase size as text', async () => {
    renderReviews();
    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Verified purchase')).toBeInTheDocument();
    expect(screen.getAllByText('True to size', { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText('Purchased size', { exact: false })).toHaveTextContent('M');
    expect(screen.getByText('The fabric and fit are excellent.')).toBeInTheDocument();
  });

  it('keeps the product page usable when the reviews endpoint returns an invalid success payload', async () => {
    mocks.get.mockResolvedValueOnce({ data: { summary: { reviewCount: 0 } } });

    renderReviews();

    expect(await screen.findByRole('alert')).toHaveTextContent(enMessages.productReviews.errors.generic);
    expect(screen.getByRole('heading', { name: enMessages.productReviews.title })).toBeInTheDocument();
    expect(screen.queryByText('Great fit')).not.toBeInTheDocument();
  });

  it('offers review submission only for backend-eligible purchases', async () => {
    mocks.auth.isAuthenticated = true;
    mocks.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/reviews/eligibility')) {
        return { data: [{
          orderItemId: 'purchase-token',
          orderNumber: 'AV-2042',
          reviewId: null,
          reviewStatus: null,
          purchasedVariant: { size: 'M' },
        }] };
      }
      return {
        data: {
          summary: { averageRating: null, reviewCount: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, fitDistribution: {} },
          items: [],
          pagination: { page: 1, pages: 0 },
        },
      };
    });
    renderReviews();
    fireEvent.click(await screen.findByRole('button', { name: 'Leave a review' }));
    expect(await screen.findByRole('radiogroup', { name: 'Rating' })).toBeInTheDocument();
    expect(screen.getByLabelText('5 out of 5 stars')).toBeInTheDocument();
    expect(screen.getByLabelText('Your review', { exact: false })).toBeInTheDocument();
  });
});
