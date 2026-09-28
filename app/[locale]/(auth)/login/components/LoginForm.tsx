'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'code'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messageFrom = (value: unknown) => (value as any)?.response?.data?.message || 'Не удалось выполнить запрос';
  const submit = async () => {
    setLoading(true); setError('');
    try {
      if (step === 'credentials') {
        await api.post('/auth/login/phone/request-code', { phone, password });
        setStep('code');
      } else {
        const { data } = await api.post<{ accessToken: string; user: AuthUser }>('/auth/login/phone/verify-code', { phone, code });
        setAuth(data.user, data.accessToken);
        router.replace(`/${locale}`);
      }
    } catch (value) { setError(messageFrom(value)); }
    finally { setLoading(false); }
  };

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-white">Вход в AVERON</h1><p className="mt-1.5 text-sm text-stone-400">{step === 'credentials' ? 'Введите номер и пароль. Затем подтвердите вход кодом из SMS.' : `Код отправлен на ${phone}`}</p></div>
    {error ? <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"><AlertCircle size={16}/>{error}</div> : null}
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4">
      {step === 'credentials' ? <>
        <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Номер телефона</span><div className="relative"><Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"/><input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"/></div></label>
        <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Пароль</span><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"/><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-11 text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        <div className="flex justify-end"><Link href={`/${locale}/forgot-password`} className="text-sm font-semibold text-violet-400 hover:text-violet-300">Забыли пароль?</Link></div>
      </> : <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Код из SMS</span><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0,6))} autoFocus inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-center text-2xl font-bold tracking-[.45em] text-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"/></label>}
      <button disabled={loading || (step === 'credentials' ? !phone || !password : code.length !== 6)} className="h-12 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{loading ? 'Подождите…' : step === 'credentials' ? 'Продолжить' : 'Подтвердить и войти'}</button>
    </form>
    {step === 'code' ? <button onClick={() => { setStep('credentials'); setCode(''); }} className="mx-auto flex items-center gap-2 text-sm text-stone-400"><ArrowLeft size={15}/>Изменить данные</button> : null}
    <p className="text-center text-sm text-stone-500">Нет аккаунта? <Link href={`/${locale}/register`} className="font-semibold text-violet-400 hover:text-violet-300">Зарегистрируйтесь</Link></p>
  </div>;
}
