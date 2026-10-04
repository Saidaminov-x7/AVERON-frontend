import type { LucideIcon } from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { Suspense } from 'react';

type StatusPageProps = { code: string; eyebrow: string; title: string; description: string; icon: LucideIcon; onRetry?: () => void; retryLabel?: string; homeLabel: string };

export function StatusPage({ code, eyebrow, title, description, icon: Icon, onRetry, retryLabel = 'Попробовать снова', homeLabel }: StatusPageProps) {
  return (
    <main className="mx-auto grid min-h-[72vh] w-full max-w-[1232px] place-items-center px-4 py-12 sm:px-6">
      <section className="averon-panel grid w-full max-w-4xl overflow-hidden md:grid-cols-[.72fr_1fr]">
        <div className="relative flex min-h-64 flex-col justify-between overflow-hidden bg-[var(--color-primary)] p-8 text-white md:min-h-[440px] md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 border border-white/15" /><div className="absolute -bottom-20 -left-20 h-72 w-72 border border-white/10" />
          <div className="relative flex items-center gap-3 text-xs font-bold tracking-[.22em]"><span>AVERON</span><span className="h-1.5 w-1.5 bg-white" /></div>
          <div className="relative"><p className="text-[5.5rem] font-semibold leading-none tracking-[-.08em] opacity-95 md:text-[7rem]">{code}</p><p className="mt-4 max-w-xs text-sm leading-6 text-white/70">Цифровой магазин продолжает работать — эта страница просто недоступна.</p></div>
        </div>
        <div className="flex flex-col justify-center bg-[var(--color-surface)] p-8 md:p-12">
          <div className="mb-8 flex h-12 w-12 items-center justify-center border border-[var(--color-border)] text-[var(--color-primary)]"><Icon size={22} strokeWidth={1.7} /></div>
          <p className="averon-kicker">{eyebrow}</p><h1 className="averon-title mt-3 text-3xl text-stone-950 dark:text-white sm:text-4xl">{title}</h1><p className="mt-4 max-w-md text-sm leading-6 text-stone-500 dark:text-zinc-400">{description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">{onRetry && <button type="button" onClick={onRetry} className="averon-primary-button"><RotateCcw size={16} />{retryLabel}</button>}<Suspense fallback={null}><SmartBackButton fallbackHref="/" label={homeLabel} variant={onRetry ? 'secondary' : 'primary'} /></Suspense></div>
        </div>
      </section>
    </main>
  );
}
