'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { calculateDropdownPosition, type DropdownPosition } from '@/lib/dropdown-position';

export interface DropdownOption {
  value: string;
  label: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  disabledPlaceholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setPosition(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recalculate against the actual rendered menu and current viewport on every scroll/resize.
  useLayoutEffect(() => {
    if (!open || !portalReady || !triggerRef.current || !menuRef.current) return;
    const update = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      setPosition(calculateDropdownPosition({
        trigger,
        menuHeight: menu.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    }
  }, [open, portalReady, options.length]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 text-left text-xs font-semibold text-stone-900 transition-all hover:border-primary-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#1E1E1E] dark:text-white dark:hover:border-primary-500 cursor-pointer"
      >
        <span className={current ? 'truncate' : 'truncate text-stone-400 dark:text-stone-400'}>
          {current ? current.label : disabled ? disabledPlaceholder ?? placeholder : placeholder}
        </span>
        <svg
          className={`shrink-0 text-stone-400 transition-transform duration-200 dark:text-stone-400 ${open ? 'rotate-180' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !disabled && portalReady && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={placeholder}
          onKeyDown={(event) => {
            const choices = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);
            const focused = choices.indexOf(document.activeElement as HTMLButtonElement);
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const delta = event.key === 'ArrowDown' ? 1 : -1;
              choices[Math.max(0, Math.min(choices.length - 1, focused + delta))]?.focus();
            }
          }}
          className="fixed z-[1000] overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl shadow-black/20 dark:border-white/10 dark:bg-stone-900 dark:shadow-black/60"
          style={position ? {
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight,
            visibility: 'visible',
          } : { visibility: 'hidden', left: 0, top: 0, width: triggerRef.current?.offsetWidth }}
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange('');
              setOpen(false);
              triggerRef.current?.focus();
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs text-stone-400 transition-colors hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-white/5 cursor-pointer font-medium"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                value === opt.value
                  ? 'bg-primary-600 text-white font-bold dark:bg-primary-600 dark:text-white'
                  : 'text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/10 font-medium'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-primary-600 dark:text-primary-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
