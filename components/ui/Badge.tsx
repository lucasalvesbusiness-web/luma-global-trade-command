import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/15 bg-ink-800 text-ink-100',
        outline: 'border-white/15 bg-transparent text-ink-300',
        verified: 'border-amber/40 bg-amber/10 text-amber-glow',
        warning: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
        muted: 'border-white/5 bg-ink-800 text-ink-400',
        mono: 'border-white/10 bg-transparent font-mono text-ink-300 normal-case tracking-normal',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
