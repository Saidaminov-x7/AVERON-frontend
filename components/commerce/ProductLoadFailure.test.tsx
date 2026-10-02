import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductLoadFailure } from './ProductLoadFailure';

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

describe('ProductLoadFailure', () => {
  beforeEach(() => router.refresh.mockReset());

  it('shows a localized network failure and retries through router.refresh', () => {
    render(<ProductLoadFailure locale="en" kind="network" catalogHref="/en/catalog?country=CN" />);

    expect(screen.getByRole('heading', { name: 'Catalog connection unavailable' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading' }));

    expect(router.refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Back to catalog' })).toHaveAttribute(
      'href',
      '/en/catalog?country=CN',
    );
  });
});
