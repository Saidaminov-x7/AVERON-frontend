'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Phone } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

interface LoginFormProps { locale: string }

export function LoginForm({ locale }: LoginFormProps) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [phone, setPhone] = useState('+998 ');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messageFrom = (value: unknown) => {
    const candidate = value as { response?: { data?: { message?: string } }; message?: string };
    return candidate?.response?.data?.message || candidate?.message || 'Не удалось выполнить запрос';
  };

  const requestCode = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/auth/phone/request-code', { phone });
      setStep('code');
    } catch (value) { setError(messageFrom(value)); }
    finally { setLoading(false); }
  };

  const verifyCode = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/phone/verify-code', { phone, code });
      setAuth(data.user, data.accessToken);
      router.replace(`/${locale}`);
    } catch (value) { setError(messageFrom(value)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-white">Вход по номеру телефона</h1>
        <p className="text-sm text-stone-400">{step === 'phone' ? 'Отправим одноразовый код в SMS' : `Введите код, отправленный на ${phone}`}</p>
      </div>
      {error && <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
      <form onSubmit={(event) => { event.preventDefault(); void (step === 'phone' ? requestCode() : verifyCode()); }} className="space-y-4">
        {step === 'phone' ? (
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Номер телефона</span>
            <div className="relative">
              <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500" />
              <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-white outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </label>
        ) : (
          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Код из SMS</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-center text-2xl font-bold tracking-[0.45em] text-white outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20" />
          </label>
        )}
        <button type="submit" disabled={loading || (step === 'code' && code.length !== 6)} className="flex h-12 w-full items-center justify-center rounded-xl bg-primary-600 font-semibold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Подождите…' : step === 'phone' ? 'Получить код' : 'Войти'}
        </button>
      </form>
      {step === 'code' && <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); }} className="mx-auto flex items-center gap-2 text-sm text-stone-400 transition hover:text-white"><ArrowLeft size={15} />Изменить номер</button>}
      <p className="text-center text-xs leading-5 text-stone-500">Продолжая, вы соглашаетесь с условиями сервиса и политикой конфиденциальности.</p>
    </div>
  );
}
