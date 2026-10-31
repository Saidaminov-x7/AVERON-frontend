'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSafeInternalReturnTo } from '@/lib/safe-navigation';
import { AlertTriangle, Hammer, RefreshCw, KeyRound, Lock, CheckCircle2, X } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const requestedReturn = getSafeInternalReturnTo(searchParams.get('returnTo'), locale);
  const returnPath = requestedReturn && !requestedReturn.split(/[?#]/)[0].endsWith('/maintenance') ? requestedReturn : `/${locale || 'ru'}`;
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
        const res = await fetch('/api/backend/site-settings/public', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          // Если режим обслуживания отключили - автоматически перенаправляем на главную
          if (!data.maintenanceMode) {
            router.replace(returnPath);
          }
        }
      } catch {
        // A transient status-check failure should leave the retry action available.
      }
    };

    const interval = setInterval(checkMaintenanceStatus, 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') void checkMaintenanceStatus(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [returnPath, router]);

  const handleManualCheck = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/backend/site-settings/public', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (!data.maintenanceMode) {
          router.replace(returnPath);
          return;
        }
      }
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
        router.replace(returnPath);
        router.refresh();
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="max-w-lg w-full space-y-6 animate-in fade-in duration-200 relative z-10">
        <div className="relative mx-auto w-20 h-20 border border-[var(--color-border)] bg-[var(--color-surface-soft)] flex items-center justify-center text-[var(--color-text)]">
          <Hammer className="w-10 h-10" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface-soft text-ink flex items-center justify-center font-bold text-xs">
            !
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--color-text)]">
            Технические работы
          </h1>
          <p className="text-ink-soft text-base leading-relaxed">
            {settings.maintenanceMessage ||
              'Сайт находится в разработке. Мы скоро вернемся с обновленной версией!'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-soft border border-line text-xs text-ink-soft flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
          <span>Все сервисы платформы временно приостановлены для обновления</span>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleManualCheck}
            disabled={isCheckingStatus}
            className="averon-primary-button w-full sm:w-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            Проверить доступ
          </button>

          {settings.maintenancePasswordEnabled && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-soft hover:bg-surface-soft border border-line text-ink-soft text-sm font-semibold transition-all"
            >
              <KeyRound className="w-4 h-4 text-primary-400" />
              Ввести пароль
            </button>
          )}
        </div>
      </section>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-surface-soft border border-line p-6 shadow-2xl text-left space-y-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-ink-soft hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pr-12">
              <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text)]">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-bold text-lg text-white">Доступ по паролю</h3>
                <p className="text-xs text-ink-soft">Введите пароль для раннего доступа к сайту</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-soft mb-2">
                  Пароль обхода
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль..."
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-soft border border-line text-white placeholder-stone-500 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {passwordError && (
                <div className="p-3 rounded-xl bg-surface-soft border border-line text-xs text-error flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-error" />
                  <span>{passwordError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-ink-soft hover:text-white text-sm font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !password.trim()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Войти на сайт
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
