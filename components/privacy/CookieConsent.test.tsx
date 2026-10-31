import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { CookieConsent } from './CookieConsent';
import { CookieSettingsLink } from './CookieSettingsLink';
import { CONSENT_STORAGE_KEY, hasAnalyticsConsent } from '@/lib/consent';
import enMessages from '@/messages/en.json';
import ruMessages from '@/messages/ru.json';
import uzMessages from '@/messages/uz.json';

function renderConsent(locale: 'ru' | 'uz' | 'en' = 'en') {
  const messages = { ru: ruMessages, uz: uzMessages, en: enMessages }[locale];
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CookieConsent />
      <CookieSettingsLink label={messages.consent.manage} />
    </NextIntlClientProvider>,
  );
}

describe('CookieConsent', () => {
  afterEach(() => {
    localStorage.clear();
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  it.each([
    ['ru', ruMessages.consent],
    ['uz', uzMessages.consent],
    ['en', enMessages.consent],
  ] as const)('offers translated accept/reject/settings controls for %s', async (locale, copy) => {
    renderConsent(locale);
    expect(await screen.findByRole('button', { name: copy.reject })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.accept })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.settings })).toBeInTheDocument();
  });

  it('rejects optional analytics without creating an analytics device identifier', async () => {
    renderConsent();
    fireEvent.click(await screen.findByRole('button', { name: enMessages.consent.reject }));
    await waitFor(() => expect(hasAnalyticsConsent()).toBe(false));
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('"analytics":false');
    expect(localStorage.getItem('averon_device_id')).toBeNull();
    expect(await screen.findByRole('button', { name: enMessages.consent.manage })).toBeInTheDocument();
    expect(document.querySelector('.cookie-settings-trigger')).toBeNull();
  });

  it('only enables optional analytics after explicit acceptance and supports later withdrawal', async () => {
    renderConsent();
    fireEvent.click(await screen.findByRole('button', { name: enMessages.consent.accept }));
    await waitFor(() => expect(hasAnalyticsConsent()).toBe(true));
    fireEvent.click(await screen.findByRole('button', { name: enMessages.consent.manage }));
    fireEvent.click(screen.getByRole('button', { name: enMessages.consent.reject }));
    await waitFor(() => expect(hasAnalyticsConsent()).toBe(false));
  });

  it('returns keyboard focus to the banner settings control after Escape', async () => {
    renderConsent();
    const settingsButton = await screen.findByRole('button', { name: enMessages.consent.settings });
    settingsButton.focus();
    fireEvent.click(settingsButton);
    const dialog = screen.getByRole('dialog', { name: enMessages.consent.settingsTitle });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.activeElement).toBe(settingsButton);
  });

  it('shows the settings dialog and locks scrolling only for the dialog lifetime', async () => {
    const user = userEvent.setup();
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'clip';
    renderConsent();
    const settingsButton = await screen.findByRole('button', { name: enMessages.consent.settings });

    await user.click(settingsButton);
    const dialog = await screen.findByRole('dialog', { name: enMessages.consent.settingsTitle });
    expect(dialog).toBeVisible();
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).toBe('hidden');
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('auto');
    expect(document.documentElement.style.overflow).toBe('clip');
    expect(settingsButton).toHaveFocus();
  });

  it('uses a two-column action group so later consent actions wrap naturally', async () => {
    renderConsent();
    const settingsButton = await screen.findByRole('button', { name: enMessages.consent.settings });
    const actions = settingsButton.closest('aside')?.querySelector('.cookie-consent-actions');

    expect(actions).toBeInTheDocument();
    expect(actions?.children).toHaveLength(3);
  });

  it('keeps focus inside the dialog when tabbing forward or backward from the dialog surface', async () => {
    renderConsent();
    fireEvent.click(await screen.findByRole('button', { name: enMessages.consent.settings }));
    const dialog = screen.getByRole('dialog', { name: enMessages.consent.settingsTitle });
    const close = screen.getByRole('button', { name: enMessages.consent.close });
    const save = screen.getByRole('button', { name: enMessages.consent.save });

    expect(dialog).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(save).toHaveFocus();

    dialog.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
  });

  it.each(['close', 'backdrop'] as const)('restores focus after closing settings with %s', async (method) => {
    renderConsent();
    const settingsButton = await screen.findByRole('button', { name: enMessages.consent.settings });
    settingsButton.focus();
    fireEvent.click(settingsButton);
    if (method === 'close') {
      fireEvent.click(screen.getByRole('button', { name: enMessages.consent.close }));
    } else {
      const backdrop = screen.getByRole('dialog', { name: enMessages.consent.settingsTitle }).parentElement;
      fireEvent.mouseDown(backdrop!);
    }
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.activeElement).toBe(settingsButton);
  });

  it('keeps analytics disabled for malformed or expired choices', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, '{bad');
    expect(hasAnalyticsConsent()).toBe(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, analytics: true, updatedAt: 1 }));
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
