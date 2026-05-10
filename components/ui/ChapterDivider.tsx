import { TechLabel } from '@/components/ui/TechLabel';
import { cn } from '@/lib/utils';

type ChapterDividerProps = {
  code: string;
  title: string;
  className?: string;
};

export function ChapterDivider({ code, title, className }: ChapterDividerProps) {
  return (
    <div
      className={cn(
        'relative mx-auto flex max-w-layout items-center gap-6 px-6 py-12',
        className,
      )}
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/15" />
      <div className="flex items-center gap-4">
        <TechLabel dot>{code}</TechLabel>
        <span className="display-md text-base text-ink-100">{title}</span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/15" />
    </div>
  );
}
