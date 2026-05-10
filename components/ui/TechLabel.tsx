import { cn } from '@/lib/utils';

type TechLabelProps = {
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
};

export function TechLabel({ children, dot = false, className }: TechLabelProps) {
  return (
    <span className={cn('tech-label inline-flex items-center gap-2', className)}>
      {dot && (
        <span
          aria-hidden
          className="h-1 w-1 rounded-full bg-amber"
          style={{ boxShadow: '0 0 6px rgba(201,169,104,0.6)' }}
        />
      )}
      {children}
    </span>
  );
}
