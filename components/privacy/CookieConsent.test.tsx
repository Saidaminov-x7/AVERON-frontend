import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CookieConsent } from './CookieConsent';
import { CONSENT_STORAGE_KEY, hasAnalyticsConsent } from '@/lib/consent';
import enMessages from '@/messages/en.json';
import ruMessages from '@/messages/ru.json';
import uzMessages from '@/messages/uz.json';

function renderConsent(locale: 'ru' | 'uz' | 'en' = 'en') {
  const messages = { ru: ruMessages, uz: uzMessages, en: enMessages }[locale];
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CookieConsent />
    </NextIntlClientProvider>,
  );
}

describe('CookieConsent', () => {
  afterEach(() => localStorage.clear());

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
  });

  it('returns focus and restores scrolling when settings close with Escape', async () => {
    renderConsent();
    const opener = await screen.findByRole('button', { name: enMessages.consent.settings });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('only enables optional analytics after explicit acceptance and supports later withdrawal', async () => {
    renderConsent();
    fireEvent.click(await screen.findByRole('button', { name: enMessages.consent.accept }));
    await waitFor(() => expect(hasAnalyticsConsent()).toBe(true));
    fireEvent.click(await screen.findByRole('button', { name: enMessages.consent.manage }));
    fireEvent.click(screen.getByRole('button', { name: enMessages.consent.reject }));
    await waitFor(() => expect(hasAnalyticsConsent()).toBe(false));
  });

  it('keeps analytics disabled for malformed or expired choices', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, '{bad');
    expect(hasAnalyticsConsent()).toBe(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: 1, analytics: true, updatedAt: 1 }));
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
