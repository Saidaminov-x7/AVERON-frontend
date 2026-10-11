'use client';

import { use } from 'react';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { getSafeInternalReturnTo } from '@/lib/safe-navigation';

export default function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { locale } = use(params);
  const { returnTo: rawReturnTo } = use(searchParams);
  const returnToValue = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo;
  const returnTo = getSafeInternalReturnTo(returnToValue, locale) ?? undefined;

  return (
    <ForgotPasswordForm locale={locale} returnTo={returnTo} />
  );
}