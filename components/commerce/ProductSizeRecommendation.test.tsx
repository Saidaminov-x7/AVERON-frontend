import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enMessages from '@/messages/en.json';
import { ProductSizeRecommendation } from './ProductSizeRecommendation';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  auth: { accessToken: null as string | null, user: null as { heightCm?: number | null; weightKg?: number | null } | null },
}));

vi.mock('@/lib/axios', () => ({ default: { get: mocks.get } }));
vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof mocks.auth) => unknown) => selector(mocks.auth),
}));

function renderRecommendation() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ProductSizeRecommendation productId="blue-shirt" />
    </NextIntlClientProvider>,
  );
}

describe('ProductSizeRecommendation', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.auth = { accessToken: null, user: null };
  });

  it('does not request or show personal size guidance without a saved authenticated body profile', () => {
    renderRecommendation();
    expect(mocks.get).not.toHaveBeenCalled();
    expect(screen.queryByText(/recommended size/i)).not.toBeInTheDocument();
  });

  it('shows the product-specific server recommendation and low-confidence disclosure', async () => {
    mocks.auth = { accessToken: 'test-token', user: { heightCm: 174, weightKg: 67 } };
    mocks.get.mockResolvedValue({ data: { sizeRecommendation: { size: 'L', confidence: 'low', fit: 'regular' } } });

    renderRecommendation();

    expect(await screen.findByText('Recommended size: L')).toBeInTheDocument();
    expect(screen.getByText('Approximate recommendation')).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith('/products/blue-shirt');
  });

  it('keeps the product page quiet when the product has no applicable size chart', async () => {
    mocks.auth = { accessToken: 'test-token', user: { heightCm: 174, weightKg: 67 } };
    mocks.get.mockResolvedValue({ data: { sizeRecommendation: null } });

    renderRecommendation();

    await vi.waitFor(() => expect(mocks.get).toHaveBeenCalledOnce());
    expect(screen.queryByText(/recommended size/i)).not.toBeInTheDocument();
  });
});
