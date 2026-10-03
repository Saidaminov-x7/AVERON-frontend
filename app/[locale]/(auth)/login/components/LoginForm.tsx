'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { SmsUnavailableNotice } from '@/components/auth/SmsUnavailableNotice';
import { useSmsVerificationAvailability } from '@/hooks/useSmsVerificationAvailability';
import { getLocalizedApiError } from '@/lib/localized-api-error';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';
import { getSafeInternalReturnTo } from '@/lib/safe-navigation';

const copies = {
  ru: { title: 'Вход в AVERON', intro: 'Введите номер и пароль. Затем подтвердите вход кодом из SMS.', sent: 'Код отправлен на', phone: 'Номер телефона', password: 'Пароль', forgot: 'Забыли пароль?', sms: 'Код из SMS', wait: 'Входим…', next: 'Продолжить', confirm: 'Подтвердить и войти', change: 'Изменить данные', noAccount: 'Нет аккаунта?', register: 'Зарегистрируйтесь', error: 'Не удалось выполнить запрос', checkingSms: 'Проверяем доступность SMS…', smsUnavailable: 'SMS недоступны' },
  uz: { title: 'AVERON’ga kirish', intro: 'Telefon raqami va parolni kiriting. So‘ng SMS kod bilan tasdiqlang.', sent: 'Kod yuborildi:', phone: 'Telefon raqami', password: 'Parol', forgot: 'Parolni unutdingizmi?', sms: 'SMS kodi', wait: 'Kirilmoqda…', next: 'Davom etish', confirm: 'Tasdiqlash va kirish', change: 'Ma’lumotlarni o‘zgartirish', noAccount: 'Akkauntingiz yo‘qmi?', register: 'Ro‘yxatdan o‘ting', error: 'So‘rovni bajarib bo‘lmadi', checkingSms: 'SMS imkoniyati tekshirilmoqda…', smsUnavailable: 'SMS mavjud emas' },
  en: { title: 'Sign in to AVERON', intro: 'Enter your phone and password, then confirm with the SMS code.', sent: 'Code sent to', phone: 'Phone number', password: 'Password', forgot: 'Forgot password?', sms: 'SMS code', wait: 'Signing in…', next: 'Continue', confirm: 'Confirm and sign in', change: 'Change details', noAccount: 'No account?', register: 'Create one', error: 'The request could not be completed', checkingSms: 'Checking SMS availability…', smsUnavailable: 'SMS unavailable' },
} as const;

export function LoginForm({ locale }: { locale: string }) {
  const copy = copies[locale as keyof typeof copies] ?? copies.ru;
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const smsAvailable = useSmsVerificationAvailability();
  const requestPending = useRef(false);
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (requestPending.current || smsAvailable !== true) return;
    requestPending.current = true;
    setLoading(true);
    setError('');
    try {
      if (step === 'credentials') {
        await api.post('/auth/login/phone/request-code', { phone, password });
        setStep('code');
      } else {
        const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
          '/auth/login/phone/verify-code',
          { phone, code },
        );
        setAuth(data.user, data.accessToken);
        const destination = getSafeInternalReturnTo(searchParams.get('returnTo'), locale)
          ?? `/${locale}/profile`;
        router.replace(destination);
      }
    } catch (value: unknown) {
      setError(getLocalizedApiError(value, locale, 'login'));
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  };

  const field = 'h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-primary-400';
  const disabled = loading || smsAvailable !== true || (step === 'credentials'
    ? !phone.trim() || !password
    : code.length !== 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{copy.title}</h1>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300">
          {step === 'credentials' ? copy.intro : `${copy.sent} ${phone}`}
        </p>
      </div>
      {smsAvailable === false ? <SmsUnavailableNotice locale={locale} /> : null}
      {smsAvailable === null ? <p className="text-sm text-stone-500 dark:text-stone-400" role="status">{copy.checkingSms}</p> : null}
      {error ? (
        <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </div>
      ) : null}
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4">
        {step === 'credentials' ? (
          <>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{copy.phone}</span>
              <div className="relative">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden="true" />
                <input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" className={`${field} pl-11 pr-4`} />
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{copy.password}</span>
              <div className="relative">
                <LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden="true" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={`${field} pl-11 pr-11`} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-sm text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-stone-500 dark:hover:text-stone-300">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            <div className="flex justify-end">
              <Link href={`/${locale}/forgot-password`} className="rounded-sm text-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300">{copy.forgot}</Link>
            </div>
          </>
        ) : (
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{copy.sms}</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus inputMode="numeric" autoComplete="one-time-code" className={`${field} h-14 px-4 text-center text-2xl font-bold tracking-[.45em]`} />
          </label>
        )}
        <Button
          type="submit"
          loading={loading}
          loadingLabel={copy.wait}
          disabled={disabled}
          className="h-12 w-full rounded-xl bg-primary-600 font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          {smsAvailable === false ? copy.smsUnavailable : step === 'credentials' ? copy.next : copy.confirm}
        </Button>
      </form>
      {step === 'code' ? (
        <button type="button" onClick={() => { setStep('credentials'); setCode(''); }} className="mx-auto flex min-h-10 items-center gap-2 rounded-sm text-sm text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-stone-400 dark:hover:text-stone-200">
          <ArrowLeft size={15} aria-hidden="true" />
          {copy.change}
        </button>
      ) : null}
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        {copy.noAccount}{' '}
        <Link href={`/${locale}/register`} className="rounded-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300">{copy.register}</Link>
      </p>
    </div>
  );
}
