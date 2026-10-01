'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
}

export function QuantityStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  decreaseLabel,
  increaseLabel,
}: QuantityStepperProps) {
  const boundedMax = Math.max(min, max);
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < boundedMax;

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-11 items-center rounded-xl border border-stone-300 dark:border-white/15"
    >
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={!canDecrease}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-11 w-11 place-items-center rounded-l-xl hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <output
        aria-label={`${label}: ${value}`}
        aria-live="polite"
        aria-atomic="true"
        className="min-w-10 text-center text-sm font-semibold tabular-nums"
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={!canIncrease}
        onClick={() => onChange(Math.min(boundedMax, value + 1))}
        className="grid h-11 w-11 place-items-center rounded-r-xl hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-500 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
