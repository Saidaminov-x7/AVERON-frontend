'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { SmsUnavailableNotice } from '@/components/auth/SmsUnavailableNotice';
import { useSmsVerificationAvailability } from '@/hooks/useSmsVerificationAvailability';
import { getLocalizedApiError } from '@/lib/localized-api-error';

const copy = {
  ru: { title: 'Восстановление пароля', intro: 'Введите номер телефона. Мы отправим код подтверждения по SMS.', code: 'Код отправлен на', phone: 'Номер телефона', sms: 'Код из SMS', password: 'Новый пароль', confirm: 'Повторите пароль', send: 'Получить код', save: 'Сменить пароль', back: 'Изменить номер', done: 'Пароль изменён. Все старые сессии завершены.', login: 'Войти', mismatch: 'Пароли не совпадают.', wait: 'Сохраняем…', unavailable: 'SMS недоступны', checking: 'Проверяем доступность SMS…' },
  uz: { title: 'Parolni tiklash', intro: 'Telefon raqamingizni kiriting. Tasdiqlash kodi SMS orqali yuboriladi.', code: 'Kod yuborildi:', phone: 'Telefon raqami', sms: 'SMS kodi', password: 'Yangi parol', confirm: 'Parolni takrorlang', send: 'Kod olish', save: 'Parolni almashtirish', back: 'Raqamni o‘zgartirish', done: 'Parol almashtirildi. Eski seanslar yakunlandi.', login: 'Kirish', mismatch: 'Parollar mos emas.', wait: 'Saqlanmoqda…', unavailable: 'SMS mavjud emas', checking: 'SMS imkoniyati tekshirilmoqda…' },
  en: { title: 'Reset password', intro: 'Enter your phone number. We will send a verification code by SMS.', code: 'Code sent to', phone: 'Phone number', sms: 'SMS code', password: 'New password', confirm: 'Repeat password', send: 'Get code', save: 'Change password', back: 'Change phone', done: 'Password changed. All old sessions were signed out.', login: 'Sign in', mismatch: 'Passwords do not match.', wait: 'Saving…', unavailable: 'SMS unavailable', checking: 'Checking SMS availability…' },
} as const;

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.ru;
  const smsAvailable = useSmsVerificationAvailability();
  const requestPending = useRef(false);
  const [step, setStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [phone, setPhone] = useState('+998 ');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step === 'code' && password !== confirm) {
      setError(t.mismatch);
      return;
    }
    if (requestPending.current || smsAvailable !== true) return;
    requestPending.current = true;
    setLoading(true);
    setError('');
    try {
      if (step === 'phone') {
        await api.post('/auth/password/phone/request-code', { phone });
        setStep('code');
      } else {
        await api.post('/auth/password/phone/verify-code', { phone, code, password });
        setStep('done');
      }
    } catch (value: unknown) {
      setError(getLocalizedApiError(value, locale, 'passwordReset'));
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><LockKeyhole aria-hidden="true" /></div>
        <h1 className="text-2xl font-bold text-white">{t.done}</h1>
        <Link href={`/${locale}/login`} className="flex h-12 items-center justify-center rounded-xl bg-primary-600 font-semibold text-white">{t.login}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        <p className="mt-2 text-sm text-stone-400">{step === 'phone' ? t.intro : `${t.code} ${phone}`}</p>
      </div>
      {smsAvailable === false ? <SmsUnavailableNotice locale={locale} /> : smsAvailable === null ? <p className="text-sm text-stone-400" role="status">{t.checking}</p> : null}
      {error ? <div className="flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400" role="alert"><AlertCircle size={17} aria-hidden="true" />{error}</div> : null}
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        {step === 'phone' ? (
          <label className="block">
            <span className="text-xs font-semibold uppercase text-stone-400">{t.phone}</span>
            <div className="relative mt-2">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" size={17} aria-hidden="true" />
              <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-white outline-none focus:border-primary-500" />
            </div>
          </label>
        ) : (
          <>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-stone-400">{t.sms}</span>
              <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className="mt-2 h-14 w-full rounded-xl border border-white/10 bg-white/5 text-center text-2xl font-bold tracking-[.4em] text-white outline-none focus:border-primary-500" />
            </label>
            {[t.password, t.confirm].map((label, index) => (
              <label key={label} className="block">
                <span className="text-xs font-semibold uppercase text-stone-400">{label}</span>
                <div className="relative mt-2">
                  <input type={show ? 'text' : 'password'} value={index ? confirm : password} onChange={(event) => index ? setConfirm(event.target.value) : setPassword(event.target.value)} autoComplete={index ? 'new-password' : 'new-password'} className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-11 text-white outline-none focus:border-primary-500" />
                  {index === 0 ? <button type="button" onClick={() => setShow((visible) => !visible)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button> : null}
                </div>
              </label>
            ))}
          </>
        )}
        <Button
          type="submit"
          loading={loading}
          loadingLabel={t.wait}
          disabled={loading || smsAvailable !== true || (step === 'code' && (code.length !== 6 || password.length < 8))}
          className="h-12 w-full rounded-xl bg-primary-600 font-semibold text-white hover:bg-primary-500"
        >
          {smsAvailable === false ? t.unavailable : step === 'phone' ? t.send : t.save}
        </Button>
      </form>
      {step === 'code' ? <button type="button" onClick={() => setStep('phone')} className="mx-auto flex min-h-10 items-center gap-2 rounded-sm text-sm text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><ArrowLeft size={15} aria-hidden="true" />{t.back}</button> : null}
    </div>
  );
}
