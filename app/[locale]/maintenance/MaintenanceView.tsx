'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Hammer, RefreshCw, KeyRound, Lock, CheckCircle2, X } from 'lucide-react';

interface MaintenanceViewProps {
  locale: string;
  initialSettings: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string | null;
    maintenancePasswordEnabled?: boolean;
  };
}

const copy = {
  ru: {
    title: 'Технические работы',
    fallback: 'Сайт находится на техническом обслуживании. Мы скоро вернёмся!',
    notice: 'Все сервисы платформы временно приостановлены для обновления.',
    check: 'Проверить доступ',
    password: 'Ввести пароль',
    dialogTitle: 'Доступ по паролю',
    dialogDescription: 'Введите пароль для раннего доступа к сайту.',
    passwordLabel: 'Пароль обхода',
    placeholder: 'Введите пароль',
    cancel: 'Отмена',
    submit: 'Войти на сайт',
    wrongPassword: 'Неверный пароль для обхода техобслуживания.',
    connectionError: 'Не удалось связаться с сервером. Попробуйте ещё раз.',
    closeDialog: 'Закрыть окно',
  },
  uz: {
    title: 'Texnik ishlar',
    fallback: 'Sayt texnik xizmatda. Tez orada yana qaytamiz!',
    notice: 'Yangilash sababli platformaning barcha xizmatlari vaqtincha to‘xtatilgan.',
    check: 'Kirishni tekshirish',
    password: 'Parolni kiritish',
    dialogTitle: 'Parol orqali kirish',
    dialogDescription: 'Saytga oldindan kirish uchun parolni kiriting.',
    passwordLabel: 'Cheklovni aylanib o‘tish paroli',
    placeholder: 'Parolni kiriting',
    cancel: 'Bekor qilish',
    submit: 'Saytga kirish',
    wrongPassword: 'Texnik xizmat cheklovini aylanib o‘tish paroli noto‘g‘ri.',
    connectionError: 'Server bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.',
    closeDialog: 'Oynani yopish',
  },
  en: {
    title: 'We’re making improvements',
    fallback: 'The site is temporarily undergoing maintenance. We’ll be back soon!',
    notice: 'All platform services are temporarily paused for an update.',
    check: 'Check availability',
    password: 'Enter password',
    dialogTitle: 'Password access',
    dialogDescription: 'Enter your password for early access to the site.',
    passwordLabel: 'Maintenance bypass password',
    placeholder: 'Enter password',
    cancel: 'Cancel',
    submit: 'Open the site',
    wrongPassword: 'That maintenance bypass password is incorrect.',
    connectionError: 'Could not reach the server. Please try again.',
    closeDialog: 'Close dialog',
  },
} as const;

export function MaintenanceView({ locale, initialSettings }: MaintenanceViewProps) {
  const router = useRouter();
  const t = copy[locale as keyof typeof copy] ?? copy.ru;
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const passwordId = useId();
  const passwordTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const res = await fetch('/api/backend/site-settings/public', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          if (!data.maintenanceMode) router.push(`/${locale || 'ru'}`);
        }
      } catch {
        // Keep the maintenance page available while the status endpoint is unreachable.
      }
    };

    const interval = setInterval(checkMaintenanceStatus, 10000);
    return () => clearInterval(interval);
  }, [locale, router]);

  useEffect(() => {
    if (!showPasswordModal) return;
    const passwordTrigger = passwordTriggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isVerifying) {
        setShowPasswordModal(false);
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      passwordTrigger?.focus();
    };
  }, [showPasswordModal, isVerifying]);

  const handleManualCheck = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/backend/site-settings/public', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (!data.maintenanceMode) {
          router.push(`/${locale || 'ru'}`);
          return;
        }
      }
    } catch {
      // Leave the page in place when the status endpoint is temporarily unavailable.
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setPasswordError('');

    try {
      const res = await fetch('/api/backend/site-settings/public/check-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.allowed) {
        document.cookie = `maintenance_bypass=true; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        setShowPasswordModal(false);
        router.push(`/${locale || 'ru'}`);
        router.refresh();
      } else {
        setPasswordError(data.message || t.wrongPassword);
      }
    } catch {
      setPasswordError(t.connectionError);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10 text-center text-[var(--color-text)] sm:px-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text)] sm:h-24 sm:w-24">
          <Hammer aria-hidden="true" className="h-10 w-10 sm:h-12 sm:w-12" />
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 font-bold text-neutral-950">!</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.title}</h1>
          <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
            {settings.maintenanceMessage?.trim() || t.fallback}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-secondary)]">
          <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-warning)]" />
          <span>{t.notice}</span>
        </div>

        <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleManualCheck}
            disabled={isCheckingStatus}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-on-primary)] shadow-sm transition-colors hover:opacity-85 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-info)]"
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            {t.check}
          </button>

          {settings.maintenancePasswordEnabled && (
            <button
              ref={passwordTriggerRef}
              type="button"
              onClick={() => { setPasswordError(''); setShowPasswordModal(true); }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-info)]"
            >
              <KeyRound aria-hidden="true" className="h-4 w-4 text-[var(--color-info)]" />
              {t.password}
            </button>
          )}
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isVerifying) setShowPasswordModal(false); }}>
          <section
            role="dialog"
            ref={dialogRef}
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            className="relative my-auto w-full max-w-md space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left text-[var(--color-text)] shadow-2xl sm:p-6"
          >
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              aria-label={t.closeDialog}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-info)]"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-info)]">
                <Lock aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id={dialogTitleId} className="text-lg font-bold">{t.dialogTitle}</h2>
                <p id={dialogDescriptionId} className="text-sm text-[var(--color-text-secondary)]">{t.dialogDescription}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
              <div>
                <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium">{t.passwordLabel}</label>
                <input
                  id={passwordId}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.placeholder}
                  autoFocus
                  required
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'maintenance-password-error' : undefined}
                  className="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-info)]"
                />
              </div>

              {passwordError && (
                <div id="maintenance-password-error" role="alert" className="flex items-center gap-2 rounded-xl border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
                  <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-2 pt-1 sm:flex-row sm:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-info)]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !password.trim()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-info)]"
                >
                  {isVerifying ? <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
                  {t.submit}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
