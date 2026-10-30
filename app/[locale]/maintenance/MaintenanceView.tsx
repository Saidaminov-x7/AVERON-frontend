'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Hammer, KeyRound, Lock, RefreshCw, X } from 'lucide-react';

interface MaintenanceViewProps {
  locale: string;
  initialSettings: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string | null;
    maintenancePasswordEnabled?: boolean;
  };
}

const copy = {
  ru: { eyebrow: 'AVERON · ОБНОВЛЕНИЕ', title: 'Скоро вернёмся', body: 'Мы обновляем магазин, чтобы сделать покупки удобнее. Страница автоматически вернётся к вам, когда сайт заработает.', status: 'Проверяем доступность магазина', retry: 'Проверить ещё раз', password: 'Есть код доступа?', passwordTitle: 'Ранний доступ', passwordBody: 'Введите код, который вам предоставила команда AVERON.', passwordLabel: 'Код доступа', cancel: 'Отмена', enter: 'Продолжить', checking: 'Проверяем…', unavailable: 'Сайт пока недоступен. Попробуйте ещё раз через минуту.', wrongPassword: 'Не удалось подтвердить код. Проверьте его и повторите попытку.' },
  uz: { eyebrow: 'AVERON · YANGILANISH', title: 'Tez orada qaytamiz', body: 'Xaridlarni qulayroq qilish uchun do‘konni yangilayapmiz. Sayt ishlashi bilan avvalgi sahifangizga avtomatik qaytasiz.', status: 'Do‘kon mavjudligini tekshiryapmiz', retry: 'Yana tekshirish', password: 'Kirish kodingiz bormi?', passwordTitle: 'Erta kirish', passwordBody: 'AVERON jamoasi taqdim etgan kirish kodini kiriting.', passwordLabel: 'Kirish kodi', cancel: 'Bekor qilish', enter: 'Davom etish', checking: 'Tekshirilmoqda…', unavailable: 'Sayt hali mavjud emas. Bir daqiqadan keyin qayta urinib ko‘ring.', wrongPassword: 'Kodni tasdiqlab bo‘lmadi. Tekshirib, qayta urinib ko‘ring.' },
  en: { eyebrow: 'AVERON · UPDATE', title: 'We’ll be right back', body: 'We’re updating the store to make shopping easier. This page will return you to where you were as soon as the site is available.', status: 'Checking store availability', retry: 'Check again', password: 'Have an access code?', passwordTitle: 'Early access', passwordBody: 'Enter the access code shared with you by the AVERON team.', passwordLabel: 'Access code', cancel: 'Cancel', enter: 'Continue', checking: 'Checking…', unavailable: 'The site is still unavailable. Please try again in a minute.', wrongPassword: 'We could not verify that code. Check it and try again.' },
} as const;

const STATUS_CHECK_TIMEOUT_MS = 15_000;

export function MaintenanceView({ locale, initialSettings }: MaintenanceViewProps) {
  const router = useRouter();
  const lang = (['ru', 'uz', 'en'].includes(locale) ? locale : 'ru') as keyof typeof copy;
  const text = copy[lang];
  const [settings, setSettings] = useState(initialSettings);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const statusCheckController = useRef<AbortController | null>(null);

  const returnToSite = useCallback(() => {
    const requested = new URLSearchParams(window.location.search).get('returnTo');
    const safePath = requested?.startsWith(`/${locale}/`) || requested === `/${locale}`
      ? requested
      : `/${locale}`;
    router.replace(safePath);
  }, [locale, router]);

  const checkMaintenanceStatus = useCallback(async (manual = false) => {
    if (statusCheckController.current) return;
    const controller = new AbortController();
    statusCheckController.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, STATUS_CHECK_TIMEOUT_MS);
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/backend/site-settings/public', { cache: 'no-store', signal: controller.signal });
      if (!res.ok) throw new Error('status');
      const data = await res.json();
      if (controller.signal.aborted || statusCheckController.current !== controller) return;
      setSettings(data);
      setStatusError('');
      if (!data.maintenanceMode) returnToSite();
    } catch {
      if (controller.signal.aborted && !timedOut) return;
      if (statusCheckController.current !== controller) return;
      if (manual) setStatusError(text.unavailable);
    } finally {
      window.clearTimeout(timeoutId);
      if (statusCheckController.current === controller) {
        statusCheckController.current = null;
        setIsCheckingStatus(false);
      }
    }
  }, [returnToSite, statusCheckController, text.unavailable]);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => void checkMaintenanceStatus(), 0);
    const interval = window.setInterval(() => void checkMaintenanceStatus(), 10000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
      statusCheckController.current?.abort();
      statusCheckController.current = null;
    };
  }, [checkMaintenanceStatus, statusCheckController]);

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) return;
    setIsVerifying(true);
    setPasswordError('');
    try {
      const res = await fetch(apiUrl('site-settings/public/check-bypass'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.allowed) {
        document.cookie = `maintenance_bypass=true; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        setShowPasswordModal(false);
        returnToSite();
      } else {
        setPasswordError(data.message || text.wrongPassword);
      }
    } catch {
      setPasswordError(text.unavailable);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="averon-site-shell relative grid min-h-[calc(100dvh-72px)] place-items-center overflow-hidden bg-[var(--color-bg)] px-4 py-10 text-[var(--color-text)] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--color-border)]" />
      <section className="relative w-full max-w-[720px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center sm:px-12 sm:py-14">
        <div className="mx-auto grid size-14 place-items-center border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]">
          <Hammer aria-hidden="true" size={23} strokeWidth={1.7} />
        </div>
        <p className="averon-kicker mt-7">{text.eyebrow}</p>
        <h1 className="averon-title mt-3 text-3xl sm:text-5xl">{text.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
          {settings.maintenanceMessage || text.body}
        </p>

        <div className="mx-auto mt-8 flex w-fit items-center gap-2 border border-[var(--color-border)] px-4 py-3 text-xs text-[var(--color-text-secondary)]" role="status" aria-live="polite">
          <span className={`size-2 rounded-full ${isCheckingStatus ? 'animate-pulse bg-[var(--color-primary)]' : 'bg-[var(--color-error)]'}`} />
          {isCheckingStatus ? text.status : text.unavailable}
        </div>
        {statusError && <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">{statusError}</p>}

        <div className="mx-auto mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={() => void checkMaintenanceStatus(true)} disabled={isCheckingStatus} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-secondary)] disabled:cursor-wait disabled:opacity-60">
            <RefreshCw aria-hidden="true" size={16} className={isCheckingStatus ? 'animate-spin' : ''} />
            {isCheckingStatus ? text.checking : text.retry}
          </button>
          {settings.maintenancePasswordEnabled && <button type="button" onClick={() => setShowPasswordModal(true)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-[var(--color-border)] px-5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-soft)]"><KeyRound aria-hidden="true" size={16} />{text.password}</button>}
        </div>
      </section>

      {showPasswordModal && <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPasswordModal(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="maintenance-password-title" className="relative w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left shadow-2xl sm:p-8">
          <button type="button" onClick={() => setShowPasswordModal(false)} aria-label={text.cancel} className="absolute right-4 top-4 grid size-10 place-items-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"><X size={18} /></button>
          <div className="flex items-center gap-3 pr-10"><span className="grid size-10 place-items-center border border-[var(--color-border)] bg-[var(--color-surface-soft)]"><Lock size={18} /></span><div><p className="averon-kicker">AVERON</p><h2 id="maintenance-password-title" className="mt-1 text-lg font-semibold">{text.passwordTitle}</h2></div></div>
          <p className="mt-5 text-sm leading-6 text-[var(--color-text-secondary)]">{text.passwordBody}</p>
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium" htmlFor="maintenance-access-code">{text.passwordLabel}</label>
            <input id="maintenance-access-code" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" />
            {passwordError && <p role="alert" className="flex items-start gap-2 text-sm text-[var(--color-error)]"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{passwordError}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowPasswordModal(false)} className="min-h-11 border border-[var(--color-border)] px-4 text-sm font-medium hover:bg-[var(--color-surface-soft)]">{text.cancel}</button><button type="submit" disabled={isVerifying || !password.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-secondary)] disabled:opacity-60">{isVerifying ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{text.enter}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
