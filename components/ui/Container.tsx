import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: number | string;
}

export function Container({ maxWidth = 1440, className, style, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12', className)}
      style={{ ...style, maxWidth }}
      {...props}
    />
  );
}
