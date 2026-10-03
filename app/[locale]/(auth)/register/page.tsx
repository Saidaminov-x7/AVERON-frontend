'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';
import { getLocalizedApiError } from '@/lib/localized-api-error';
import { useSmsVerificationAvailability } from '@/hooks/useSmsVerificationAvailability';
import { SmsUnavailableNotice } from '@/components/auth/SmsUnavailableNotice';
import { Button } from '@/components/ui/Button';

const copy = {
  ru: {
    title: 'Регистрация',
    intro: 'Создайте аккаунт по номеру телефона — без email.',
    codeIntro: (phone: string) => `Введите код из SMS, отправленный на ${phone}`,
    name: 'Имя',
    phone: 'Номер телефона',
    password: 'Пароль',
    confirmPassword: 'Повторите пароль',
    passwordHint: 'Не менее 8 символов.',
    code: 'Код из SMS',
    getCode: 'Получить код',
    confirm: 'Подтвердить регистрацию',
    requesting: 'Получаем код…',
    registering: 'Регистрируем…',
    mismatch: 'Пароли не совпадают.',
    checkingSms: 'Проверяем доступность SMS…',
    smsUnavailable: 'SMS недоступны',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    editDetails: 'Изменить данные',
    consent: 'Нажимая «Получить код», вы принимаете',
    terms: 'условия использования',
    and: 'и',
    privacy: 'политику конфиденциальности',
    existingAccount: 'Уже есть аккаунт?',
    login: 'Войти',
  },
  uz: {
    title: 'Ro‘yxatdan o‘tish',
    intro: 'Telefon raqami orqali, emailsiz hisob yarating.',
    codeIntro: (phone: string) => `${phone} raqamiga yuborilgan SMS kodini kiriting`,
    name: 'Ism',
    phone: 'Telefon raqami',
    password: 'Parol',
    confirmPassword: 'Parolni takrorlang',
    passwordHint: 'Kamida 8 ta belgi.',
    code: 'SMS kodi',
    getCode: 'Kod olish',
    confirm: 'Ro‘yxatdan o‘tishni tasdiqlash',
    requesting: 'Kod olinmoqda…',
    registering: 'Ro‘yxatdan o‘tilmoqda…',
    mismatch: 'Parollar mos emas.',
    checkingSms: 'SMS imkoniyati tekshirilmoqda…',
    smsUnavailable: 'SMS mavjud emas',
    showPassword: 'Parolni ko‘rsatish',
    hidePassword: 'Parolni yashirish',
    editDetails: 'Ma’lumotlarni o‘zgartirish',
    consent: '«Kod olish» tugmasini bosish orqali siz',
    terms: 'foydalanish shartlarini',
    and: 'va',
    privacy: 'maxfiylik siyosatini',
    existingAccount: 'Hisobingiz bormi?',
    login: 'Kirish',
  },
  en: {
    title: 'Create an account',
    intro: 'Create an account with your phone number — no email required.',
    codeIntro: (phone: string) => `Enter the SMS code sent to ${phone}`,
    name: 'Name',
    phone: 'Phone number',
    password: 'Password',
    confirmPassword: 'Confirm password',
    passwordHint: 'At least 8 characters.',
    code: 'SMS code',
    getCode: 'Get code',
    confirm: 'Confirm registration',
    requesting: 'Requesting code…',
    registering: 'Registering…',
    mismatch: 'Passwords do not match.',
    checkingSms: 'Checking SMS availability…',
    smsUnavailable: 'SMS unavailable',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    editDetails: 'Edit details',
    consent: 'By selecting “Get code”, you agree to the',
    terms: 'Terms of Use',
    and: 'and',
    privacy: 'Privacy Policy',
    existingAccount: 'Already have an account?',
    login: 'Sign in',
  },
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const locale = (useParams()?.locale as string) || 'ru';
  const text = copy[locale as keyof typeof copy] ?? copy.ru;
  const setAuth = useAuthStore((state) => state.setAuth);
  const smsAvailable = useSmsVerificationAvailability();
  const requestPending = useRef(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (step === 'form' && password !== confirm) {
      setError(text.mismatch);
      return;
    }
    if (requestPending.current || smsAvailable !== true) return;
    requestPending.current = true;
    setLoading(true);
    setError('');
    try {
      if (step === 'form') {
        await api.post('/auth/register/phone/request-code', { name, phone, password });
        setStep('code');
      } else {
        const { data } = await api.post<{ accessToken: string; user: AuthUser }>(
          '/auth/register/phone/verify-code',
          { phone, code },
        );
        setAuth(data.user, data.accessToken);
        router.replace(`/${locale}/profile`);
      }
    } catch (value: unknown) {
      setError(getLocalizedApiError(value, locale, 'registration'));
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  };

  const field =
    'h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-stone-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-primary-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{text.title}</h1>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-300">
          {step === 'form' ? text.intro : text.codeIntro(phone)}
        </p>
      </div>
      {smsAvailable === false ? (
        <SmsUnavailableNotice locale={locale} />
      ) : smsAvailable === null ? (
        <p className="text-sm text-stone-500 dark:text-stone-400" role="status">{text.checkingSms}</p>
      ) : null}
      {error ? (
        <div
          className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          <AlertCircle size={16} aria-hidden="true" />
          {error}
        </div>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        {step === 'form' ? (
          <>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{text.name}</span>
              <input
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className={field}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{text.phone}</span>
              <input
                required
                minLength={7}
                maxLength={30}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                className={field}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{text.password}</span>
              <div className="relative">
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className={`${field} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? text.hidePassword : text.showPassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-sm text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-stone-500 dark:hover:text-stone-300"
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              <span className="text-xs text-stone-500 dark:text-stone-400">{text.passwordHint}</span>
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{text.confirmPassword}</span>
              <input
                required
                minLength={8}
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                className={field}
              />
            </label>
            <p className="text-xs leading-5 text-stone-500 dark:text-stone-400">
              {text.consent}{' '}
              <Link href={`/${locale}/terms`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">{text.terms}</Link>{' '}
              {text.and}{' '}
              <Link href={`/${locale}/privacy`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">{text.privacy}</Link>.
            </p>
          </>
        ) : (
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{text.code}</span>
            <input
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={`${field} h-14 text-center text-2xl font-bold tracking-[.45em]`}
            />
          </label>
        )}
        <Button
          type="submit"
          loading={loading}
          loadingLabel={step === 'form' ? text.requesting : text.registering}
          disabled={loading || smsAvailable !== true || (step === 'form'
            ? name.trim().length < 2 || password.length < 8 || confirm.length < 8
            : code.length !== 6)}
          className="h-12 w-full rounded-xl bg-primary-600 font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500"
        >
          {smsAvailable === false ? text.smsUnavailable : step === 'form' ? text.getCode : text.confirm}
        </Button>
      </form>
      {step === 'code' ? (
        <button
          type="button"
          onClick={() => {
            setStep('form');
            setCode('');
          }}
          className="mx-auto flex min-h-10 items-center gap-2 rounded-sm text-sm text-stone-600 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-stone-400 dark:hover:text-stone-200"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {text.editDetails}
        </button>
      ) : null}
      <p className="text-center text-sm text-stone-600 dark:text-stone-400">
        {text.existingAccount}{' '}
        <Link href={`/${locale}/login`} className="font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300">{text.login}</Link>
      </p>
    </div>
  );
}
