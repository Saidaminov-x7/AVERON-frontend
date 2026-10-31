'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { clearAnalyticsIdentifier, readOptionalConsent, saveOptionalConsent, subscribeToConsentChanges } from '@/lib/consent';

export function CookieConsent() {
  const t = useTranslations('consent');
  const locale = useLocale();
  const [ready, setReady] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const savedChoice = useRef<boolean | null>(null);

  useEffect(() => {
    const current = readOptionalConsent();
    setChoice(current?.analytics ?? null);
    setAnalytics(current?.analytics ?? false);
    savedChoice.current = current?.analytics ?? null;
    setReady(true);
  }, []);

  useEffect(() => {
    const handleChoice = () => {
      const current = readOptionalConsent();
      setChoice(current?.analytics ?? null);
      setAnalytics(current?.analytics ?? false);
      savedChoice.current = current?.analytics ?? null;
    };
    return subscribeToConsentChanges(handleChoice);
  }, []);

  useEffect(() => {
    const open = () => openSettings();
    window.addEventListener('averon-open-consent-settings', open);
    return () => window.removeEventListener('averon-open-consent-settings', open);
  }, [choice]);

  useEffect(() => {
    if (!settingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = dialogRef.current;
    panel?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)'));
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
        event.preventDefault();
        focusable[0]?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (settingsOpen) return;
    const opener = openerRef.current;
    if (!opener) return;
    if (opener.isConnected) opener.focus();
    else triggerRef.current?.focus();
    openerRef.current = null;
  }, [settingsOpen]);

  const save = (allowAnalytics: boolean) => {
    const next = saveOptionalConsent(allowAnalytics);
    if (!next) return;
    if (!allowAnalytics) clearAnalyticsIdentifier();
    savedChoice.current = allowAnalytics;
    setChoice(allowAnalytics);
    if (!allowAnalytics) setAnalytics(false);
    setSettingsOpen(false);
  };

  const openSettings = () => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAnalytics(choice === true);
    setSettingsOpen(true);
  };

  if (!ready) return null;

  return (
    <>
      {choice === null ? (
        <aside className="cookie-consent-banner" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
          <div className="min-w-0 flex-1">
            <p id="cookie-consent-title" className="text-sm font-semibold text-[var(--color-text)]">{t('title')}</p>
            <p id="cookie-consent-description" className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
              {t('description')}{' '}
              <Link className="underline underline-offset-2" href={`/${locale}/privacy`}>{t('privacyLink')}</Link>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => save(false)}>{t('reject')}</Button>
            <Button type="button" variant="outline" size="sm" onClick={openSettings}>{t('settings')}</Button>
            <Button type="button" size="sm" onClick={() => save(true)}>{t('accept')}</Button>
          </div>
        </aside>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="cookie-settings-trigger"
          onClick={openSettings}
        >
          {t('manage')}
        </button>
      )}

      {settingsOpen && (
        <div className="cookie-consent-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSettingsOpen(false);
        }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cookie-settings-title" className="cookie-consent-dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-settings-title" className="text-xl font-semibold text-[var(--color-text)]">{t('settingsTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{t('settingsDescription')}</p>
              </div>
              <button type="button" className="averon-control-button averon-icon-button" aria-label={t('close')} onClick={() => setSettingsOpen(false)}>×</button>
            </div>

            <div className="mt-5 divide-y divide-[var(--color-border)] rounded-[var(--radius-control)] border border-[var(--color-border)] px-4">
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t('necessary')}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{t('necessaryDescription')}</p>
                </div>
                <input type="checkbox" checked disabled aria-label={t('necessary')} className="size-5 shrink-0 accent-[var(--color-primary)]" />
              </div>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
                <span>
                  <span className="block text-sm font-semibold text-[var(--color-text)]">{t('analytics')}</span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{t('analyticsDescription')}</span>
                </span>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="size-5 shrink-0 accent-[var(--color-primary)]" />
              </label>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--color-text-secondary)]">{t('retention')}</p>
            <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => save(false)}>{t('reject')}</Button>
              <Button type="button" onClick={() => save(analytics)}>{t('save')}</Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
