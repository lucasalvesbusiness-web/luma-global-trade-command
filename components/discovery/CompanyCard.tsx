'use client';

import Link from 'next/link';

import type { DiscoveryResult } from '@/server/trpc/routers/discovery';
import { Badge } from '@/components/ui/Badge';
import { StatusChip } from '@/components/ui/StatusChip';
import { useDiscoveryStore } from '@/lib/discovery/store';
import { cn } from '@/lib/utils';

export function CompanyCard({ company }: { company: DiscoveryResult }) {
  const { hoveredId, selectedId, setHover, setSelected } = useDiscoveryStore();
  const active = hoveredId === company.id || selectedId === company.id;

  return (
    <Link
      href={`/company/${company.slug}`}
      onMouseEnter={() => setHover(company.id)}
      onMouseLeave={() => setHover(null)}
      onClick={() => setSelected(company.id)}
      className={cn(
        'block rounded-lg border bg-luma-offwhite/60 p-4 transition-all',
        active
          ? 'border-luma-ink shadow-md'
          : 'border-luma-ink/10 hover:border-luma-ink/30',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base leading-tight">
            {company.tradeName ?? company.legalName}
          </h3>
          {company.city && (
            <p className="mt-0.5 text-xs text-luma-ink/60">
              {company.city}
              {company.state ? ` · ${company.state}` : ''}
              {company.distanceKm !== null && ` · ${company.distanceKm} km`}
            </p>
          )}
        </div>
        <StatusChip kind="verification" value={company.verificationStatus} />
      </div>

      {company.description && (
        <p className="mt-2 line-clamp-2 text-sm text-luma-ink/70">{company.description}</p>
      )}

      {company.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {company.categories.slice(0, 4).map((cat) => (
            <Badge key={cat} variant="muted">
              {cat}
            </Badge>
          ))}
          {company.categories.length > 4 && (
            <Badge variant="outline">+{company.categories.length - 4}</Badge>
          )}
        </div>
      )}
    </Link>
  );
}
