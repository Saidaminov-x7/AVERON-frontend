'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login, getMe } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginFormValues } from '../schemas/loginSchema';
import { getErrorDetails } from '@/lib/errorDetails';

export function useAuth(locale: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await login(data.identifier, data.password);
      
      const token = response.accessToken || response.token;
      let user = response.user;

      if (!user && token) {
        useAuthStore.getState().setToken(token);
        user = await getMe();
      }

      if (token && user) {
        setAuth(user, token);
      }

      const redirect = searchParams.get('redirect') || '/profile';
      const destination = redirect.startsWith('/') ? `/${locale}${redirect}` : `/${locale}/${redirect}`;
      router.push(destination);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const { message: responseMessage, status } = getErrorDetails(err);
      // Never reveal if email exists — always show generic message
      const message = (status === 401 || status === 403 || status === 400)
        ? 'Неверный email или пароль'
        : responseMessage || 'Ошибка входа. Попробуйте позже.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleLogin };
}