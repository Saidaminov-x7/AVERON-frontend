'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { LanguageFlag, type LocaleFlagCode } from '@/components/ui/LanguageFlag';

const locales: Array<{ code: LocaleFlagCode; label: string }> = [
  { code: 'ru', label: 'Русский' },
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'en', label: 'English' },
];

export function LanguageDropdown({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const ref      = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const current  = locales.find(l => l.code === locale) ?? locales[0];
  const menuId = 'storefront-language-options';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  const switchLocale = (code: string) => {
    setOpen(false);
    if (code === locale) return;
    const segments = pathname.split('/').filter(Boolean);
    segments[0] = code;
    router.push('/' + segments.join('/'));
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        aria-label="Сменить язык"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-base transition-colors hover:border-stone-400 hover:bg-stone-50 dark:border-white/15 dark:bg-[#2A2A2A] dark:hover:bg-[#333333]"
      >
        <LanguageFlag locale={current.code} className="h-5 w-[30px]" />
        <svg
          className={`transition-transform duration-200 text-stone-500 dark:text-stone-400 ${open ? 'rotate-180' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-full z-200 mt-2 w-40 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl shadow-stone-900/10 dark:border-white/10 dark:bg-[#242424] dark:shadow-black/40">
          {locales.map(({ code, label }) => {
            const isActive = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => switchLocale(code)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isActive ? 'bg-primary-50 dark:bg-primary-950/40' : 'hover:bg-stone-50 dark:hover:bg-white/5'
                }`}
              >
                <LanguageFlag locale={code} />
                <span className={`flex-1 font-medium ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-stone-700 dark:text-stone-300'}`}>
                  {label}
                </span>
                {isActive && (
                  <svg className="text-primary-500" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
