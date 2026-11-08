import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  maxWidth?: number | string;
  as?: 'div' | 'main';
}

export function Container({ as: Element = 'div', maxWidth = 1440, className, style, ...props }: ContainerProps) {
  return (
    <Element
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12', className)}
      style={{ ...style, maxWidth }}
      {...props}
    />
  );
}
