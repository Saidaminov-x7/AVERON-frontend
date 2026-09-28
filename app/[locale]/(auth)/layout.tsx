'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { use } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default function AuthLayout({ children, params }: AuthLayoutProps) {
  return (
    <AuthLayoutInner params={params}>
      {children}
    </AuthLayoutInner>
  );
}

function AuthLayoutInner({ children, params }: AuthLayoutProps) {
  const router = useRouter();
  const { locale } = use(params);

  return (
    <div className="relative flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center overflow-hidden bg-stone-100 px-4 py-8 dark:bg-stone-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,color-mix(in_srgb,var(--color-primary)_22%,transparent),transparent_38%)]" />
      
      {/* Decorative blobs */}
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-600/10 blur-[120px]" />

      {/* Card container */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 shadow-2xl dark:border-white/10">
          {/* Inner top gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />

          {/* Card inner container */}
          <div className="p-6 sm:p-8">
            {children}
          </div>

          {/* Inner bottom gradient stripe */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* Bottom branding */}
      <p className="relative z-10 mt-4 text-xs text-stone-500">
        © 2026 AVERON
      </p>
    </div>
  );
}
