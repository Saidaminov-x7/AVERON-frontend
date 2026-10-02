'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';

interface AuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
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
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow || window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const bounds = glow.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pointer || !glow.isConnected) return;
        glow.style.setProperty('--glow-x', `${pointer.x}px`);
        glow.style.setProperty('--glow-y', `${pointer.y}px`);
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', move); };
  }, []);

  return (
    <div className="auth-grid relative flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center overflow-hidden bg-[#090a0f] px-4 py-8">
      <div ref={glowRef} className="auth-pointer-glow pointer-events-none absolute inset-0" />
      
      {/* Decorative blobs */}
      <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary-600/10 blur-[120px]" />

      {/* Card container */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 shadow-2xl dark:border-white/10">
          {/* Inner top gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />

          {/* Card inner container */}
          <div className="p-6 sm:p-8">
            <div className="mb-4">
              <SmartBackButton fallbackHref={`/${locale}/login`} />
            </div>
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
