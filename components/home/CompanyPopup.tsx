'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';

import type { HomeCompany } from '@/server/trpc/routers/home';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/components/ui/StatusChip';
import { TechLabel } from '@/components/ui/TechLabel';
import { cn } from '@/lib/utils';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function CompanyPopup({
  company,
  mountInto,
}: {
  company: HomeCompany;
  mountInto: HTMLElement;
  /** Reserved for future: if viewer's company has offerings, surface 'Iniciar negócio' */
  selfHasOfferings?: boolean;
}) {
  return createPortal(
    <article className="w-[280px] overflow-hidden">
      <header className="relative h-24 w-full overflow-hidden">
        {company.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.heroImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-amber/[0.08]">
            <span className="font-mono text-3xl font-semibold text-amber-glow">
              {initials(company.name)}
            </span>
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent"
        />
        <div className="absolute right-2 top-2">
          <StatusChip kind="verification" value={company.verificationStatus} />
        </div>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4">
        <div>
          <h3 className="display-md text-base leading-tight text-ink-50">{company.name}</h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-500">
            {company.city ? `${company.city}${company.state ? ` · ${company.state}` : ''}` : '—'}
            {' · '}
            {company.distanceKm < 1
              ? `${Math.round(company.distanceKm * 1000)}m`
              : `${company.distanceKm.toFixed(1)}km`}
          </p>
        </div>

        {company.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {company.categories.map((c) => (
              <span
                key={c}
                className="rounded-sm border border-white/10 bg-ink-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ink-300"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
          <div className="flex flex-col gap-0.5">
            <TechLabel>Deals</TechLabel>
            <span className="num-marker text-lg text-ink-100">
              {company.confirmedDealsCount}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <TechLabel>Avaliação</TechLabel>
            <span className="num-marker text-lg text-ink-100">
              {company.avgRating !== null ? company.avgRating.toFixed(1) : '—'}
            </span>
          </div>
        </dl>

        {(company.isConnected || company.isWatched) && (
          <div
            className={cn(
              'rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider',
              company.hasConfirmedDeal
                ? 'border-amber/40 bg-amber/10 text-amber-glow'
                : 'border-white/10 bg-ink-800 text-ink-300',
            )}
          >
            {company.hasConfirmedDeal
              ? `Sua rede · ${company.confirmedDealsCount} negócio${company.confirmedDealsCount > 1 ? 's' : ''} juntos`
              : 'Acompanhando'}
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/c/${company.slug}`}>Ver perfil →</Link>
          </Button>
        </div>
      </div>
    </article>,
    mountInto,
  );
}
