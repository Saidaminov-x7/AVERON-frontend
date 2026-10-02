'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/store/useAuthStore';
import { getErrorDetails } from '@/lib/errorDetails';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';

export default function RegisterPage() {
  const router = useRouter();
  const locale = (useParams()?.locale as string) || 'ru';
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState(''); const [phone, setPhone] = useState('+998 ');
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState(''); const [step, setStep] = useState<'form'|'code'>('form');
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const submit = async () => {
    if (step === 'form' && password !== confirm) return setError('Пароли не совпадают.');
    setLoading(true); setError('');
    try {
      if (step === 'form') { await api.post('/auth/register/phone/request-code', { name, phone, password }); setStep('code'); }
      else { const { data } = await api.post<{accessToken:string;user:AuthUser}>('/auth/register/phone/verify-code', { phone, code }); setAuth(data.user, data.accessToken); router.replace(`/${locale}/profile`); }
    } catch (value: unknown) { setError(getErrorDetails(value).message || 'Не удалось выполнить регистрацию.'); }
    finally { setLoading(false); }
  };
  const field = 'h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';
  return <div className="space-y-6"><SmartBackButton fallbackHref={`/${locale}`} /><div><h1 className="text-2xl font-bold text-white">Регистрация</h1><p className="mt-1.5 text-sm text-stone-400">{step === 'form' ? 'Создайте аккаунт по номеру телефона — без email.' : `Введите код из SMS, отправленный на ${phone}`}</p></div>
    {error ? <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"><AlertCircle size={16}/>{error}</div> : null}
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-4">{step === 'form' ? <>
      <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Имя</span><input value={name} onChange={(e)=>setName(e.target.value)} autoComplete="name" className={field}/></label>
      <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Номер телефона</span><input value={phone} onChange={(e)=>setPhone(e.target.value)} autoComplete="tel" inputMode="tel" className={field}/></label>
      <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Пароль</span><div className="relative"><input type={showPassword?'text':'password'} value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" className={`${field} pr-11`}/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><p className="text-xs text-stone-500">Не менее 8 символов.</p></label>
      <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Повторите пароль</span><input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" className={field}/></label>
      <p className="text-xs leading-5 text-stone-500">Нажимая «Получить код», вы принимаете <Link href={`/${locale}/terms`} className="text-primary-400">условия использования</Link> и <Link href={`/${locale}/privacy`} className="text-primary-400">политику конфиденциальности</Link>.</p>
    </> : <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Код из SMS</span><input value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} autoFocus inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className={`${field} h-14 text-center text-2xl font-bold tracking-[.45em]`}/></label>}
      <button disabled={loading || (step==='form' ? name.length<2 || password.length<8 : code.length!==6)} className="h-12 w-full rounded-xl bg-primary-600 font-semibold text-white hover:bg-primary-500 disabled:opacity-50">{loading?'Подождите…':step==='form'?'Получить код':'Подтвердить регистрацию'}</button>
    </form>
    {step==='code'?<button onClick={()=>{setStep('form');setCode('')}} className="mx-auto flex items-center gap-2 text-sm text-stone-400"><ArrowLeft size={15}/>Изменить данные</button>:null}
    <p className="text-center text-sm text-stone-500">Уже есть аккаунт? <Link href={`/${locale}/login`} className="font-semibold text-primary-400">Войти</Link></p>
  </div>;
}
