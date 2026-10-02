'use client';

import { use, Suspense } from 'react';
import { LoginForm } from './components/LoginForm';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <Suspense fallback={<div className="h-40 w-full animate-pulse" />}>
      <div>
        <SmartBackButton fallbackHref={`/${locale}`} />
        <LoginForm locale={locale} />
      </div>
    </Suspense>
  );
}