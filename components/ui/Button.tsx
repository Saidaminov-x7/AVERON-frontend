'use client';

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[var(--radius-control)] font-theme text-[length:var(--font-size-button)] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none ring-offset-[var(--color-bg)]',
  {
    variants: {
      variant: {
        default: 'averon-primary-button',
        outline: 'averon-secondary-button',
        ghost: 'averon-ghost-button',
        link: 'averon-link-button underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingLabel, children, disabled, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);
    useLayoutEffect(() => {
      if (buttonRef.current) {
        const width = buttonRef.current.getBoundingClientRect().width;
        if (width > 0) setMeasuredWidth(width);
      }
    }, [children, className, loading, size, variant]);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        {...props}
        style={{ ...props.style, ...(loading && measuredWidth ? { minWidth: `min(${measuredWidth}px, 100%)` } : {}) }}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading ? <LoaderCircle aria-hidden="true" className="mr-2 size-4 shrink-0 animate-spin motion-reduce:animate-none" /> : null}
        {loading && loadingLabel ? loadingLabel : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
