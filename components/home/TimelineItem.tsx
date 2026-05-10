'use client';

import type { HomeCompany } from '@/server/trpc/routers/home';
import { useHomeStore } from '@/lib/home/store';
import { cn } from '@/lib/utils';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function fmtDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function TimelineItem({
  company,
  variant = 'nearby',
}: {
  company: HomeCompany;
  variant?: 'nearby' | 'connected';
}) {
  const { hoveredCompanyId, selectedCompanyId, setHovered, setSelected } = useHomeStore();
  const active = hoveredCompanyId === company.id || selectedCompanyId === company.id;

  const connectionLabel =
    variant === 'connected'
      ? company.hasConfirmedDeal
        ? `${company.confirmedDealsCount} negócio${company.confirmedDealsCount > 1 ? 's' : ''}`
        : 'acompanha'
      : null;

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(company.id)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => setSelected(company.id)}
      className={cn(
        'group flex w-full items-start gap-3 border-b border-white/[0.04] px-3 py-3 text-left transition-colors',
        active ? 'bg-amber/[0.05]' : 'hover:bg-white/[0.025]',
      )}
    >
      {/* Thumb */}
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
        {company.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.heroImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center text-[10px] font-mono',
              variant === 'connected'
                ? 'bg-amber/15 text-amber-glow'
                : 'bg-ink-800 text-ink-300',
            )}
          >
            {initials(company.name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm leading-tight',
              active ? 'text-amber-glow' : 'text-ink-100',
            )}
          >
            {company.name}
          </p>
          <span className="num-marker shrink-0 text-[10px] text-ink-500">
            {fmtDist(company.distanceKm)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {company.categories[0] && (
            <span className="text-[10px] uppercase tracking-wider text-ink-400">
              {company.categories[0]}
            </span>
          )}
          {connectionLabel && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-amber-glow">
              · {connectionLabel}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
