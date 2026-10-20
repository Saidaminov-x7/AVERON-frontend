import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsTracker } from './AnalyticsTracker';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ru/catalog',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/commerceAnalytics', () => ({ trackCommerceEvent: vi.fn() }));

describe('AnalyticsTracker environment isolation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not send visit analytics from local automated tests', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<AnalyticsTracker />);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
