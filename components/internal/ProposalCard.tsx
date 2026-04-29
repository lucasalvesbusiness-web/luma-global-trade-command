'use client';

import { Anchor, Container, Package } from 'lucide-react';
import { useLocale } from 'next-intl';

import type { ProposalListItem } from '@/server/repositories/types';

function formatRelative(date: Date | string | null, locale: string): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return locale === 'pt-br' ? 'hoje' : 'today';
  if (days === 1) return locale === 'pt-br' ? 'ontem' : 'yesterday';
  if (days < 7) return locale === 'pt-br' ? `${days} dias atrás` : `${days} days ago`;
  return new Intl.DateTimeFormat(locale === 'pt-br' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
  }).format(d);
}

export function ProposalCard({
  proposal,
  onClick,
}: {
  proposal: ProposalListItem;
  onClick: () => void;
}) {
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl bg-white/80 px-3 py-2.5 text-left shadow-sm ring-1 ring-inset ring-black/5 transition hover:bg-white hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] tabular-nums text-luma-olive">
          {proposal.reference}
        </span>
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-luma-ink/55">
          {formatRelative(proposal.submittedAt ?? proposal.createdAt, locale)}
        </span>
      </div>

      <p className="mt-1.5 font-medium text-[13px] leading-tight text-luma-ink truncate">
        {proposal.buyerCompany.displayName ?? proposal.buyerCompany.legalName}
      </p>

      <p className="mt-0.5 text-[11px] text-luma-ink/60">
        {proposal.destinationCountry.name}
        {proposal.destinationPort ? ` · ${proposal.destinationPort.name}` : ''}
        {proposal.incoterm ? ` · ${proposal.incoterm}` : ''}
      </p>

      {proposal.loadPlan && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-luma-ink/65">
          <span className="inline-flex items-center gap-1">
            <Container className="h-3 w-3" strokeWidth={1.5} />
            {proposal.loadPlan.containerCode.replace(/^C_/, '').replace(/_/g, ' ')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3" strokeWidth={1.5} />
            {proposal.loadPlan.itemsCount}
          </span>
          <span className="tabular-nums">
            {Math.round(proposal.loadPlan.totalWeightKg).toLocaleString(locale)} kg
          </span>
          <span className="tabular-nums">
            {proposal.loadPlan.totalPallets} pal
          </span>
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-luma-ink/45">
        <Anchor className="h-2.5 w-2.5" strokeWidth={1.75} />
        <span>{proposal.buyerCompany.type}</span>
      </div>
    </button>
  );
}
