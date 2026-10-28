import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { CookieConsent } from './CookieConsent';
import { CookiePreferencesSection } from './CookiePreferencesSection';
import { CONSENT_STORAGE_KEY, saveOptionalConsent } from '@/lib/consent';
import enMessages from '@/messages/en.json';

describe('CookiePreferencesSection', () => {
  afterEach(() => localStorage.clear());

  it('reflects the current choice and opens the shared consent dialog', async () => {
    saveOptionalConsent(false);
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <CookieConsent />
        <CookiePreferencesSection />
      </NextIntlClientProvider>,
    );

    expect(await screen.findByText(enMessages.profile.privacy.analyticsOff)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: enMessages.profile.privacy.manage }));
    expect(await screen.findByRole('dialog', { name: enMessages.consent.settingsTitle })).toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toContain('"analytics":false');
  });
});
