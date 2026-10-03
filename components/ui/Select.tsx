'use client';

import * as React from 'react';
import { forwardRef, useState, useRef, useEffect, useLayoutEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { calculateDropdownPosition, type DropdownPosition } from '@/lib/dropdown-position';

interface SelectContextType {
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  labelMap: Record<string, React.ReactNode>;
  registerLabel: (val: string, label: React.ReactNode) => void;
  selectId: string;
  disabled: boolean;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
}

const SelectContext = createContext<SelectContextType | null>(null);

interface SelectProps {
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

function Select({ children, value: controlledValue, defaultValue = '', onValueChange, disabled = false }: SelectProps) {
  const selectId = React.useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [labelMap, setLabelMap] = useState<Record<string, React.ReactNode>>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = (val: string) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onValueChange?.(val);
    setOpen(false);
    document.getElementById(`${selectId}-trigger`)?.focus();
  };

  const registerLabel = (val: string, label: React.ReactNode) => {
    setLabelMap((prev) => (prev[val] === label ? prev : { ...prev, [val]: label }));
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen,
        labelMap,
        registerLabel,
        selectId,
        disabled,
        triggerRef,
        contentRef,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

const SelectGroup = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-1', className)} {...props} />
);
SelectGroup.displayName = 'SelectGroup';

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder = 'Select...', ...props }, ref) => {
    const context = useContext(SelectContext);
    const selectedLabel = context?.value ? context.labelMap[context.value] : null;

    return (
      <span ref={ref} className={cn('truncate', !selectedLabel && 'text-stone-400 dark:text-stone-500', className)} {...props}>
        {selectedLabel || placeholder}
      </span>
    );
  }
);
SelectValue.displayName = 'SelectValue';

const SelectTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, disabled, ...props }, ref) => {
    const context = useContext(SelectContext);

    return (
      <button
        ref={(node) => {
          context && (context.triggerRef.current = node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        id={context ? `${context.selectId}-trigger` : undefined}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={context?.open ?? false}
        aria-controls={context ? `${context.selectId}-listbox` : undefined}
        disabled={disabled || context?.disabled}
        onClick={() => !disabled && context?.setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !context?.open) {
            event.preventDefault();
            context?.setOpen(true);
            requestAnimationFrame(() => {
              const options = context?.contentRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)');
              (event.key === 'ArrowUp' ? options?.[options.length - 1] : options?.[0])?.focus();
            });
          }
        }}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 dark:text-stone-400',
            context?.open && 'rotate-180'
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const context = useContext(SelectContext);
    const [position, setPosition] = useState<DropdownPosition | null>(null);
    const [portalReady, setPortalReady] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => setPortalReady(true), []);
    useEffect(() => {
      const handleOutside = (e: MouseEvent) => {
        if (
          !containerRef.current?.contains(e.target as Node) &&
          !context?.triggerRef.current?.contains(e.target as Node)
        ) {
          context?.setOpen(false);
        }
      };
      if (context?.open) {
        document.addEventListener('mousedown', handleOutside);
      }
      return () => document.removeEventListener('mousedown', handleOutside);
    }, [context?.open, context]);

    useLayoutEffect(() => {
      if (!context?.open || !portalReady || !context.triggerRef.current || !containerRef.current) return;
      const update = () => {
        const trigger = context.triggerRef.current?.getBoundingClientRect();
        const menu = containerRef.current;
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
      };
    }, [context?.open, portalReady]);

    if (!context?.open) return null;
    if (!portalReady) return null;

    return createPortal(
      <div
        ref={(node) => {
          containerRef.current = node;
          if (context) context.contentRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        id={`${context.selectId}-listbox`}
        role="listbox"
        aria-labelledby={`${context.selectId}-trigger`}
        onKeyDown={(event) => {
          const options = Array.from(containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []);
          const index = options.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === 'Escape') {
            event.preventDefault();
            context.setOpen(false);
            document.getElementById(`${context.selectId}-trigger`)?.focus();
            return;
          }
          const targetIndex = event.key === 'ArrowDown'
            ? Math.min(index + 1, options.length - 1)
            : event.key === 'ArrowUp'
              ? Math.max(index - 1, 0)
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? options.length - 1
                  : -1;
          if (targetIndex >= 0) {
            event.preventDefault();
            options[targetIndex]?.focus();
          }
        }}
        className={cn(
          'fixed z-[1000] overflow-auto rounded-lg border border-stone-200 bg-white p-1 shadow-lg shadow-stone-900/10 dark:border-stone-700 dark:bg-stone-800 dark:shadow-black/40',
          className
        )}
        style={position ? {
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.maxHeight,
        } : { visibility: 'hidden', left: 0, top: 0, width: context.triggerRef.current?.offsetWidth }}
        {...props}
      >
        <div ref={ref}>{children}</div>
      </div>,
      document.body,
    );
  }
);
SelectContent.displayName = 'SelectContent';

const SelectLabel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-2 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400', className)} {...props} />
  )
);
SelectLabel.displayName = 'SelectLabel';

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const SelectItem = forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const context = useContext(SelectContext);
    const isSelected = context?.value === value;

    useEffect(() => {
      context?.registerLabel(value, children);
    }, [value, children, context]);

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => !props.disabled && context?.onValueChange(value)}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700',
          isSelected && 'bg-primary-600 font-medium text-white dark:bg-primary-600 dark:text-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        <span className="flex-1 text-left">{children}</span>
        {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
      </button>
    );
  }
);
SelectItem.displayName = 'SelectItem';

const SelectSeparator = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-stone-100 dark:bg-stone-700', className)} {...props} />
  )
);
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
