'use client';

import { useLocale } from "next-intl";
import { SmartBackButton } from '@/components/navigation/SmartBackButton';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthLayoutInner>
      {children}
    </AuthLayoutInner>
  );
}

function AuthLayoutInner({ children }: Pick<AuthLayoutProps, 'children'>) {
  const locale = useLocale();

  return (
    <div className="averon-auth-shell relative flex min-h-[calc(100dvh-72px)] flex-col items-center justify-center border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--color-primary)]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="p-6 sm:p-8">
            <div className="mb-4">
              <SmartBackButton fallbackHref={`/${locale}/login`} />
            </div>
            {children}
          </div>
        </div>
      </div>
      <p className="relative z-10 mt-5 text-[11px] uppercase tracking-[.12em] text-[var(--color-muted)]">
        © 2026 AVERON
      </p>
    </div>
  );
}
