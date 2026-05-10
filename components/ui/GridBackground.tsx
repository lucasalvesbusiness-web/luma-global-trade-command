import { cn } from '@/lib/utils';

type GridBackgroundProps = {
  fine?: boolean;
  fade?: boolean;
  radial?: boolean;
  className?: string;
};

export function GridBackground({
  fine = false,
  fade = true,
  radial = false,
  className,
}: GridBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0',
        fine ? 'bg-grid-fine' : 'bg-grid',
        fade && 'mask-fade-y',
        radial && 'mask-radial',
        className,
      )}
    />
  );
}
