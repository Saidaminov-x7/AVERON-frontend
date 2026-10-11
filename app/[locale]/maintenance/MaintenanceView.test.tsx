import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MaintenanceView } from './MaintenanceView';

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

const settings = {
  maintenanceMode: true,
  maintenanceMessage: null,
  maintenancePasswordEnabled: true,
};

describe('MaintenanceView', () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ maintenanceMode: true, maintenancePasswordEnabled: true }),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it.each([
    ['ru', 'Технические работы'],
    ['uz', 'Texnik ishlar'],
    ['en', 'We’re making improvements'],
  ])('renders localized maintenance content for %s', (locale, title) => {
    render(<MaintenanceView locale={locale} initialSettings={settings} />);
    expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(screen.getByRole('button', { name: locale === 'en' ? 'Check availability' : locale === 'uz' ? 'Kirishni tekshirish' : 'Проверить доступ' })).toBeTruthy();
  });

  it('preserves a configured maintenance message', () => {
    render(<MaintenanceView locale="en" initialSettings={{ ...settings, maintenanceMessage: 'We will return at 18:00.' }} />);
    expect(screen.getByText('We will return at 18:00.')).toBeTruthy();
  });

  it('shows a localized error for an invalid password and closes with Escape', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (String(input).endsWith('/check-bypass') && init?.method === 'POST') {
        return new Response(JSON.stringify({ message: 'Invalid fixture password.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ maintenanceMode: true, maintenancePasswordEnabled: true }));
    });

    render(<MaintenanceView locale="en" initialSettings={settings} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enter password' }));
    const dialog = screen.getByRole('dialog', { name: 'Password access' });
    expect(dialog).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Maintenance bypass password'), { target: { value: 'local-invalid-fixture' } });
    const closeButton = screen.getByRole('button', { name: 'Close dialog' });
    closeButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open the site' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open the site' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid fixture password.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open the site' })).not.toBeDisabled());
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Enter password' }));
    expect(push).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain('maintenance_bypass=true');
  });

  it('sets the bypass cookie and navigates only after the API allows access', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      if (String(input).endsWith('/check-bypass') && init?.method === 'POST') {
        return new Response(JSON.stringify({ allowed: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ maintenanceMode: true, maintenancePasswordEnabled: true }));
    });

    render(<MaintenanceView locale="ru" initialSettings={settings} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ввести пароль' }));
    fireEvent.change(screen.getByLabelText('Пароль обхода'), { target: { value: 'local-valid-fixture' } });
    fireEvent.click(screen.getByRole('button', { name: 'Войти на сайт' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/ru'));
    expect(document.cookie).toContain('maintenance_bypass=true');
    expect(refresh).toHaveBeenCalledOnce();
  });
});
