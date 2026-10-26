'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { clearAnalyticsIdentifier, readOptionalConsent, saveOptionalConsent, subscribeToConsentChanges } from '@/lib/consent';

export function CookieConsent() {
  const t = useTranslations('consent');
  const locale = useLocale();
  const [choice, setChoice] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const manageRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef(false);

  const openSettings = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setAnalytics(choice === true);
    setSettingsOpen(true);
  }, [choice]);

  useEffect(() => {
    const handleChoice = () => {
      const current = readOptionalConsent();
      setChoice(current?.analytics ?? null);
      setAnalytics(current?.analytics ?? false);
    };
    handleChoice();
    return subscribeToConsentChanges(handleChoice);
  }, []);

  useLayoutEffect(() => {
    if (choice !== null || !bannerRef.current) return;
    const banner = bannerRef.current;
    const updateClearance = () => {
      document.documentElement.style.setProperty('--cookie-consent-clearance', `${Math.ceil(banner.getBoundingClientRect().height + 24)}px`);
    };
    updateClearance();
    if (typeof ResizeObserver === 'undefined') {
      return () => document.documentElement.style.removeProperty('--cookie-consent-clearance');
    }
    const observer = new ResizeObserver(updateClearance);
    observer.observe(banner);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--cookie-consent-clearance');
    };
  }, [choice]);

  useLayoutEffect(() => {
    if (settingsOpen || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    (previousFocusRef.current?.isConnected ? previousFocusRef.current : manageRef.current)?.focus();
  }, [choice, settingsOpen]);

  const closeSettings = useCallback(() => {
    restoreFocusRef.current = true;
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    const open = () => openSettings();
    window.addEventListener('averon-open-consent-settings', open);
    return () => window.removeEventListener('averon-open-consent-settings', open);
  }, [openSettings]);

  useEffect(() => {
    if (!settingsOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = dialogRef.current;
    panel?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSettings();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled)'));
      if (!focusable.length) return;
      if (event.shiftKey && (document.activeElement === panel || document.activeElement === focusable[0])) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === panel) {
        event.preventDefault();
        focusable[0]?.focus();
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
  }, [settingsOpen, closeSettings]);

  const save = (allowAnalytics: boolean) => {
    const next = saveOptionalConsent(allowAnalytics);
    if (!next) return;
    if (!allowAnalytics) clearAnalyticsIdentifier();
    setChoice(allowAnalytics);
    if (!allowAnalytics) setAnalytics(false);
    restoreFocusRef.current = true;
    setSettingsOpen(false);
  };

  return (
    <>
      {choice === null ? (
        <aside ref={bannerRef} className="cookie-consent-banner" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
          <div className="min-w-0 flex-1">
            <p id="cookie-consent-title" className="text-sm font-semibold text-[var(--color-text)]">{t('title')}</p>
            <p id="cookie-consent-description" className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
              {t('description')}{' '}
              <Link className="underline underline-offset-2" href={`/${locale}/privacy`}>{t('privacyLink')}</Link>
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-11 min-h-11" onClick={() => save(false)}>{t('reject')}</Button>
            <Button type="button" variant="outline" size="sm" className="h-11 min-h-11" onClick={openSettings}>{t('settings')}</Button>
            <Button type="button" size="sm" className="h-11 min-h-11" onClick={() => save(true)}>{t('accept')}</Button>
          </div>
        </aside>
      ) : (
        <button
          ref={manageRef}
          type="button"
          className="cookie-settings-trigger"
          onClick={openSettings}
        >
          {t('manage')}
        </button>
      )}

      {settingsOpen && (
        <div className="cookie-consent-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeSettings();
        }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-labelledby="cookie-settings-title" className="cookie-consent-dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="cookie-settings-title" className="text-xl font-semibold text-[var(--color-text)]">{t('settingsTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{t('settingsDescription')}</p>
              </div>
              <button type="button" className="averon-control-button averon-icon-button" aria-label={t('close')} onClick={closeSettings}><X size={18} aria-hidden="true" /></button>
            </div>

            <div className="mt-5 divide-y divide-[var(--color-border)] rounded-[var(--radius-control)] border border-[var(--color-border)] px-4">
              <div className="flex min-h-11 items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t('necessary')}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{t('necessaryDescription')}</p>
                </div>
                <input type="checkbox" checked disabled aria-label={t('necessary')} className="size-5 shrink-0 accent-[var(--color-primary)]" />
              </div>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-4">
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
