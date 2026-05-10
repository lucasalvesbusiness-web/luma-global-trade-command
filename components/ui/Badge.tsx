import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-luma-ink/90 text-luma-offwhite',
        outline: 'border-luma-ink/20 text-luma-ink/70',
        verified: 'border-transparent bg-luma-olive/15 text-luma-olive',
        warning: 'border-transparent bg-luma-sun/15 text-luma-earth',
        muted: 'border-transparent bg-luma-sand text-luma-ink/70',
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
