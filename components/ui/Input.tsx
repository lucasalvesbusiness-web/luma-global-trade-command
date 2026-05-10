import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-white/10 bg-ink-800 px-3 py-2 text-sm text-ink-100 transition-colors duration-200 ease-cinematic placeholder:text-ink-400 focus-visible:border-amber/60 focus-visible:bg-ink-850 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber/40 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
