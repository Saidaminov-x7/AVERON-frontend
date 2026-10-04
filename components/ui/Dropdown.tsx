'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';

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
  const [openUpwards, setOpenUpwards] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Проверяем положение: если снизу недостаточно места (выступает за экран), открываем вверх
  useLayoutEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Если снизу меньше 260px и сверху места больше, открываем вверх
      if (spaceBelow < 260 && spaceAbove > spaceBelow) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="averon-control-button h-11 w-full justify-between gap-2 px-3.5 text-left text-xs disabled:cursor-not-allowed disabled:opacity-40"
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

      {open && !disabled && (
        <div
          ref={menuRef}
          className={`averon-menu-surface absolute left-0 right-0 z-50 max-h-64 overflow-y-auto p-1.5 ${
            openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className="averon-menu-item text-xs font-medium"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`averon-menu-item justify-between text-xs ${
                value === opt.value
                  ? '!bg-[var(--color-surface-soft)] !font-bold !text-[var(--color-text)]'
                  : 'font-medium'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
