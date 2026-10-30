'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { COOKIE_SETTINGS_OPEN_EVENT, readCookieConsent, saveCookieConsent } from '@/lib/cookieConsent';

const copy = {
  ru: { title: 'Настройки конфиденциальности', body: 'Необязательная аналитика помогает понять, как используется каталог. Она выключена, пока вы её не разрешите.', policy: 'Политика конфиденциальности', reject: 'Отклонить аналитику', settings: 'Настроить', allow: 'Разрешить аналитику', analytics: 'Необязательная аналитика', analyticsHelp: 'Помогает улучшать магазин. Без вашего согласия события не отправляются.', necessary: 'Необходимое хранение', necessaryHelp: 'Сохраняет выбранные настройки и обеспечивает работу сайта.', save: 'Сохранить выбор', close: 'Закрыть настройки' },
  uz: { title: 'Maxfiylik sozlamalari', body: 'Ixtiyoriy tahlil katalogdan qanday foydalanilishini tushunishga yordam beradi. Ruxsat bermaguningizcha u o‘chiq turadi.', policy: 'Maxfiylik siyosati', reject: 'Tahlilni rad etish', settings: 'Sozlash', allow: 'Tahlilga ruxsat berish', analytics: 'Ixtiyoriy tahlil', analyticsHelp: 'Do‘konni yaxshilashga yordam beradi. Roziligingizsiz hodisalar yuborilmaydi.', necessary: 'Zarur saqlash', necessaryHelp: 'Tanlovlaringizni saqlaydi va sayt ishlashini ta’minlaydi.', save: 'Tanlovni saqlash', close: 'Sozlamalarni yopish' },
  en: { title: 'Privacy preferences', body: 'Optional analytics helps us understand how the catalog is used. It stays off unless you allow it.', policy: 'Privacy policy', reject: 'Reject analytics', settings: 'Customize', allow: 'Allow analytics', analytics: 'Optional analytics', analyticsHelp: 'Helps improve the store. No events are sent without your consent.', necessary: 'Necessary storage', necessaryHelp: 'Stores your choices and keeps the site working.', save: 'Save choices', close: 'Close preferences' },
} as const;

export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT));
}

export function CookieConsent() {
  const locale = useLocale();
  const lang = (['ru', 'uz', 'en'].includes(locale) ? locale : 'ru') as keyof typeof copy;
  const text = copy[lang];
  const [visible, setVisible] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const initializeTimer = window.setTimeout(() => {
      const existing = readCookieConsent();
      if (!existing) setVisible(true);
      setAnalytics(Boolean(existing?.analytics));
    }, 0);
    const onOpen = () => {
      const current = readCookieConsent();
      setAnalytics(Boolean(current?.analytics));
      setCustomize(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_SETTINGS_OPEN_EVENT, onOpen);
    return () => {
      window.clearTimeout(initializeTimer);
      window.removeEventListener(COOKIE_SETTINGS_OPEN_EVENT, onOpen);
    };
  }, []);

  if (!visible) return null;
  const save = (allowAnalytics: boolean) => {
    saveCookieConsent(allowAnalytics);
    setAnalytics(allowAnalytics);
    setVisible(false);
    setCustomize(false);
  };
  const closeSettings = () => {
    setCustomize(false);
    if (readCookieConsent()) setVisible(false);
  };

  return <aside className="fixed inset-x-3 bottom-0 z-[80] mx-auto w-auto max-w-[1080px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-[var(--color-text)] shadow-[0_12px_40px_rgba(0,0,0,.24)] sm:inset-x-6 sm:p-5 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))]" aria-labelledby="cookie-consent-title">
    <div className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_auto] md:items-center md:gap-6">
      <div className="min-w-0">
        <h2 id="cookie-consent-title" className="text-sm font-semibold">{text.title}</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{text.body}</p>
        <Link href={`/${locale}/privacy`} className="mt-1 inline-flex min-h-7 items-center text-xs text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-text)]">{text.policy}</Link>
      </div>
      <Modal isOpen={customize} onClose={closeSettings} title={text.title} closeLabel={text.close} maxWidth="max-w-xl">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="border border-[var(--color-border)] p-3">
          <p className="text-xs font-semibold">{text.necessary}</p><p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{text.necessaryHelp}</p>
          <span className="mt-2 inline-flex min-h-7 items-center text-xs font-medium text-[var(--color-text-secondary)]">● {lang === 'ru' ? 'Всегда включено' : lang === 'uz' ? 'Doim yoqilgan' : 'Always on'}</span>
        </div>
        <label className="flex cursor-pointer items-start gap-3 border border-[var(--color-border)] p-3">
          <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="mt-0.5 size-4 accent-[var(--color-primary)]" />
          <span><span className="block text-xs font-semibold">{text.analytics}</span><span className="mt-1 block text-xs leading-5 text-[var(--color-text-secondary)]">{text.analyticsHelp}</span></span>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={closeSettings} className="min-h-11 border border-[var(--color-border)] px-3 text-xs font-semibold transition-colors hover:bg-[var(--color-surface-soft)]">{text.close}</button>
        <button type="button" onClick={() => save(analytics)} className="min-h-11 bg-[var(--color-primary)] px-4 text-xs font-semibold text-[var(--color-on-primary)] transition-colors hover:opacity-90">{text.save}</button>
      </div>
      </Modal>
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
          <button type="button" onClick={() => save(false)} className="min-h-11 border border-[var(--color-border)] px-3 text-xs font-semibold transition-colors hover:bg-[var(--color-surface-soft)] sm:px-4">{text.reject}</button>
          <button type="button" onClick={() => setCustomize(true)} className="min-h-11 border border-[var(--color-border)] px-3 text-xs font-semibold transition-colors hover:bg-[var(--color-surface-soft)] sm:px-4">{text.settings}</button>
          <button type="button" onClick={() => save(true)} className="col-span-2 min-h-11 bg-[var(--color-primary)] px-4 text-xs font-semibold text-[var(--color-on-primary)] transition-colors hover:opacity-90 md:col-span-1">{text.allow}</button>
      </div>
    </div>
  </aside>;
}
