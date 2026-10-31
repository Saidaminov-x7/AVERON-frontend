import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceView } from './MaintenanceView';

const routerMock = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

describe('MaintenanceView availability checks', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let resolveFetches: Array<(value: Response) => void>;
  let requestSignals: AbortSignal[];

  beforeEach(() => {
    vi.useFakeTimers();
    routerMock.replace.mockReset();
    window.history.replaceState({}, '', '/ru/maintenance?returnTo=%2Fru%2Fcatalog');
    resolveFetches = [];
    requestSignals = [];
    fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((resolve, reject) => {
      resolveFetches.push(resolve);
      const signal = init?.signal;
      if (signal) {
        requestSignals.push(signal);
        signal.addEventListener('abort', () => reject(new DOMException('Request aborted', 'AbortError')), { once: true });
      }
    }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('prevents overlapping polls and retries after a timed-out request', async () => {
    const { unmount } = render(<MaintenanceView locale="ru" initialSettings={{ maintenanceMode: true }} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('Проверяем доступность магазина');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status').textContent).toContain('Проверяем доступность магазина');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(screen.getByRole('status').textContent).toContain('Сайт пока недоступен');
    expect(screen.getByRole('button', { name: 'Проверить ещё раз' })).toBeEnabled();
    expect(routerMock.replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFetches[1]({ ok: true, json: async () => ({ maintenanceMode: true }) } as Response);
      await Promise.resolve();
    });
    expect(screen.getByRole('status').textContent).toContain('Сайт пока недоступен');
    unmount();
  });

  it('returns to the previous path when maintenance is over', async () => {
    render(<MaintenanceView locale="ru" initialSettings={{ maintenanceMode: true }} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
      resolveFetches[0]({ ok: true, json: async () => ({ maintenanceMode: false }) } as Response);
      await Promise.resolve();
    });

    expect(routerMock.replace).toHaveBeenCalledWith('/ru/catalog');
  });

  it('aborts an in-flight request on unmount and does not navigate from its stale response', async () => {
    let resolveLateResponse!: (value: Response) => void;
    let lateRequestSignal!: AbortSignal;
    fetchMock.mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
      lateRequestSignal = init?.signal as AbortSignal;
      return new Promise<Response>((resolve) => { resolveLateResponse = resolve; });
    });
    const { unmount } = render(<MaintenanceView locale="ru" initialSettings={{ maintenanceMode: true }} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(lateRequestSignal.aborted).toBe(true);

    await act(async () => {
      resolveLateResponse({ ok: true, json: async () => ({ maintenanceMode: false }) } as Response);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
