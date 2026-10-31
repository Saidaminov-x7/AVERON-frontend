'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Hammer, KeyRound, Lock, RefreshCw, X } from 'lucide-react';
import { resolveBrowserApiBaseUrl } from '@/lib/api-origin';
import { safeMaintenanceReturnPath } from '@/lib/maintenance-return';

const localApiUrl = process.env.NEXT_PUBLIC_AVERON_LOCAL_API_URL || 'http://127.0.0.1:8080';
const apiUrl = (path: string) => `${resolveBrowserApiBaseUrl(window.location.hostname, localApiUrl)}/${path}`;

interface MaintenanceSettings {
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
  maintenancePasswordEnabled?: boolean;
}

interface MaintenanceViewProps {
  locale: string;
  initialSettings: MaintenanceSettings;
  returnTo?: string | null;
}

const copy = {
  ru: {
    title: 'Технические работы', description: 'Сайт временно недоступен. Мы скоро вернёмся с обновлённой версией.',
    status: 'Проверяем доступность основных сервисов.', check: 'Проверить доступ', password: 'Войти по паролю',
    passwordTitle: 'Ранний доступ', passwordDescription: 'Введите пароль для доступа к сайту.', passwordLabel: 'Пароль',
    passwordPlaceholder: 'Введите пароль', cancel: 'Отмена', enter: 'Войти на сайт',
    invalidPassword: 'Неверный пароль для обхода технических работ.', connectionError: 'Не удалось проверить пароль. Проверьте подключение и попробуйте ещё раз.', close: 'Закрыть',
  },
  uz: {
    title: 'Texnik ishlar', description: 'Sayt vaqtincha ishlamayapti. Yangilangan versiya bilan tez orada qaytamiz.',
    status: 'Asosiy xizmatlar holati tekshirilmoqda.', check: 'Qayta tekshirish', password: 'Parol bilan kirish',
    passwordTitle: 'Erta kirish', passwordDescription: 'Saytga kirish uchun parolni kiriting.', passwordLabel: 'Parol',
    passwordPlaceholder: 'Parolni kiriting', cancel: 'Bekor qilish', enter: 'Saytga kirish',
    invalidPassword: 'Texnik ishlarni chetlab o‘tish paroli noto‘g‘ri.', connectionError: 'Parolni tekshirib bo‘lmadi. Ulanishni tekshirib, qayta urinib ko‘ring.', close: 'Yopish',
  },
  en: {
    title: 'Maintenance in progress', description: 'The site is temporarily unavailable. We’ll be back with an updated experience soon.',
    status: 'Checking availability of core services.', check: 'Check again', password: 'Enter access password',
    passwordTitle: 'Early access', passwordDescription: 'Enter the password to access the site.', passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password', cancel: 'Cancel', enter: 'Continue to site',
    invalidPassword: 'The maintenance access password is incorrect.', connectionError: 'Could not verify the password. Check your connection and try again.', close: 'Close',
  },
} as const;

export function MaintenanceView({ locale, initialSettings, returnTo = null }: MaintenanceViewProps) {
  const router = useRouter();
  const t = copy[locale as keyof typeof copy] ?? copy.ru;
  const returnPath = safeMaintenanceReturnPath(returnTo, locale);
  const [settings, setSettings] = useState(initialSettings);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordTriggerRef = useRef<HTMLButtonElement>(null);

  const returnToSite = useCallback(() => {
    router.replace(returnPath);
    router.refresh();
  }, [returnPath, router]);

  useEffect(() => {
    let disposed = false;
    const checkMaintenanceStatus = async () => {
      try {
        const res = await fetch(apiUrl('site-settings/public'), { cache: 'no-store' });
        if (!res.ok) return;
        const data: MaintenanceSettings = await res.json();
        if (disposed) return;
        setSettings(data);
        if (!data.maintenanceMode) returnToSite();
      } catch {
        // A transient status-check failure should leave the retry action available.
      }
    };

    void checkMaintenanceStatus();
    const interval = window.setInterval(checkMaintenanceStatus, 10000);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [returnToSite]);

  useEffect(() => {
    if (!showPasswordModal) return;
    const passwordTrigger = passwordTriggerRef.current;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    passwordInputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPasswordModal(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      passwordTrigger?.focus();
    };
  }, [showPasswordModal]);

  const handleManualCheck = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch(apiUrl('site-settings/public'), { cache: 'no-store' });
      if (!res.ok) return;
      const data: MaintenanceSettings = await res.json();
      setSettings(data);
      if (!data.maintenanceMode) returnToSite();
    } catch {
      // Keep the page available so the user can retry after a network failure.
    } finally {
      setIsCheckingStatus(false);
    }
  };

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
        setPasswordError(data.message || t.invalidPassword);
      }
    } catch {
      setPasswordError(t.connectionError);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="flex min-h-[70dvh] w-full items-center justify-center bg-[var(--color-bg)] px-4 py-12 text-center text-[var(--color-text)] sm:px-6">
      <section className="w-full max-w-xl space-y-6">
        <div className="relative mx-auto flex size-16 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]">
          <Hammer className="size-7" aria-hidden="true" />
          <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[var(--color-warning)] text-xs font-bold text-[var(--color-bg)]" aria-hidden="true">!</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">{t.title}</h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            {settings.maintenanceMessage || t.description}
          </p>
        </div>

        <div role="status" className="flex items-center justify-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs leading-5 text-[var(--color-text-secondary)]">
          <AlertTriangle className="size-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
          <span>{t.status}</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <button type="button" onClick={handleManualCheck} disabled={isCheckingStatus} aria-busy={isCheckingStatus} className="averon-primary-button w-full gap-2 px-5 sm:w-auto">
            <RefreshCw className={`size-4 ${isCheckingStatus ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t.check}
          </button>

          {settings.maintenancePasswordEnabled && (
            <button ref={passwordTriggerRef} type="button" onClick={() => setShowPasswordModal(true)} className="averon-secondary-button w-full gap-2 px-5 sm:w-auto">
              <KeyRound className="size-4" aria-hidden="true" />
              {t.password}
            </button>
          )}
        </div>
      </section>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[var(--color-overlay)] p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowPasswordModal(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="maintenance-password-title" className="relative w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left text-[var(--color-text)] sm:p-6">
            <button type="button" onClick={() => setShowPasswordModal(false)} aria-label={t.close} className="averon-control-button averon-icon-button absolute right-4 top-4">
              <X className="size-4" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 pr-12">
              <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text)]">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="maintenance-password-title" className="font-semibold">{t.passwordTitle}</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{t.passwordDescription}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="maintenance-password" className="mb-1.5 block text-sm font-medium">{t.passwordLabel}</label>
                <input ref={passwordInputRef} id="maintenance-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.passwordPlaceholder} autoComplete="current-password" required className="h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 text-sm text-[var(--color-text)] outline-none transition-colors focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30" />
              </div>

              {passwordError && (
                <p role="alert" className="flex items-start gap-2 border border-[var(--color-error)] px-3 py-2.5 text-xs leading-5 text-[var(--color-error)]">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{passwordError}</span>
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="averon-secondary-button px-4">{t.cancel}</button>
                <button type="submit" disabled={isVerifying || !password.trim()} aria-busy={isVerifying} className="averon-primary-button gap-2 px-5">
                  {isVerifying ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                  {t.enter}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
