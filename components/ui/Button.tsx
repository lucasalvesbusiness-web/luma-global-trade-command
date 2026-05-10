import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-wide uppercase transition-all duration-300 ease-cinematic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/50 focus-visible:ring-offset-2 focus-visible:ring-offset-spectre-carbon disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary:
          'border border-amber/60 bg-amber/10 text-amber-glow hover:bg-amber/20 hover:border-amber',
        outline:
          'border border-white/15 bg-transparent text-ink-100 hover:border-white/35 hover:bg-white/[0.03]',
        ghost: 'text-ink-100 hover:bg-white/[0.04]',
        subtle:
          'border border-transparent bg-ink-800 text-ink-100 hover:bg-ink-750',
        danger:
          'border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
      },
      size: {
        sm: 'h-8 px-3 text-[11px]',
        md: 'h-10 px-5 text-xs',
        lg: 'h-12 px-7 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
