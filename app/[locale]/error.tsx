'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { StatusPage } from '@/components/feedback/StatusPage';

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <StatusPage code="500" eyebrow="Сервис временно недоступен" title="Что-то пошло не так" description="Произошла непредвиденная ошибка. Мы уже получили отчёт; попробуйте повторить действие." icon={AlertTriangle} onRetry={reset} homeLabel="На главную" />;
}
