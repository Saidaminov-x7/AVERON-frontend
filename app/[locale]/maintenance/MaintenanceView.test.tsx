import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceView } from './MaintenanceView';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/lib/api-origin', () => ({ resolveBrowserApiBaseUrl: () => 'https://api.averon.test' }));

describe('MaintenanceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns to the saved localized path with its query after service recovery', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ maintenanceMode: false }), { status: 200 }));
    render(<MaintenanceView locale="ru" returnTo="/ru/catalog/coat?size=M" initialSettings={{ maintenanceMode: true }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Проверить доступ' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/ru/catalog/coat?size=M'));
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it('uses the localized home when the page was opened directly', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ maintenanceMode: false }), { status: 200 }));
    render(<MaintenanceView locale="uz" initialSettings={{ maintenanceMode: true }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Qayta tekshirish' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/uz'));
  });

  it('redirects on mount when the maintenance page opens after recovery', async () => {
    vi.mocked(fetch).mockImplementation(async () => new Response(JSON.stringify({ maintenanceMode: false }), { status: 200 }));
    render(<MaintenanceView locale="uz" returnTo="/uz/catalog?country=china" initialSettings={{ maintenanceMode: true }} />);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/uz/catalog?country=china'));
  });

  it('automatically returns to the saved route when a polling check detects recovery', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch)
      .mockImplementationOnce(async () => new Response(JSON.stringify({ maintenanceMode: true }), { status: 200 }))
      .mockImplementationOnce(async () => new Response(JSON.stringify({ maintenanceMode: false }), { status: 200 }));
    render(<MaintenanceView locale="ru" returnTo="/ru/catalog/coat?size=M" initialSettings={{ maintenanceMode: true }} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(router.replace).toHaveBeenCalledWith('/ru/catalog/coat?size=M');
  });

  it('keeps the password bypass available and returns to the same saved path', async () => {
    vi.mocked(fetch).mockImplementation(async (_input, init) => new Response(JSON.stringify(
      init?.method === 'POST' ? { allowed: true } : { maintenanceMode: true, maintenancePasswordEnabled: true },
    ), { status: 200 }));
    render(<MaintenanceView locale="en" returnTo="/en/orders?tab=active" initialSettings={{ maintenanceMode: true, maintenancePasswordEnabled: true }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter access password' }));
    const dialog = await screen.findByRole('dialog', { name: 'Early access' });
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-access-code' } });
    fireEvent.click(withinFormSubmit(dialog));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/en/orders?tab=active'));
    expect(fetch).toHaveBeenCalledWith('https://api.averon.test/site-settings/public/check-bypass', expect.objectContaining({ method: 'POST' }));
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });
});

function withinFormSubmit(dialog: HTMLElement) {
  return dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!;
}
