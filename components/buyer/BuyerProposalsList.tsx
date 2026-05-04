'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { ProposalListItem, ProposalStatus } from '@/server/repositories/types';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<ProposalStatus, { pt: string; en: string }> = {
  DRAFT: { pt: 'Rascunho', en: 'Draft' },
  SUBMITTED: { pt: 'Enviada', en: 'Submitted' },
  UNDER_COMMERCIAL_REVIEW: { pt: 'Análise comercial', en: 'Commercial review' },
  UNDER_OPERATIONAL_REVIEW: { pt: 'Análise operacional', en: 'Operational review' },
  DOCUMENTATION_REVIEW_REQUIRED: { pt: 'Revisão documental', en: 'Documentation review' },
  ADJUSTMENT_REQUESTED: { pt: 'Ajuste solicitado', en: 'Adjustment requested' },
  APPROVED_FOR_NEGOTIATION: { pt: 'Aprovada para negociação', en: 'Approved for negotiation' },
  REJECTED: { pt: 'Rejeitada', en: 'Rejected' },
  CONVERTED_TO_OPERATION: { pt: 'Em operação', en: 'In operation' },
};

const STATUS_TONE: Record<ProposalStatus, string> = {
  DRAFT: 'bg-luma-ink/5 text-luma-ink/55',
  SUBMITTED: 'bg-luma-olive/10 text-luma-olive',
  UNDER_COMMERCIAL_REVIEW: 'bg-amber-500/10 text-amber-700',
  UNDER_OPERATIONAL_REVIEW: 'bg-amber-500/10 text-amber-700',
  DOCUMENTATION_REVIEW_REQUIRED: 'bg-amber-500/10 text-amber-700',
  ADJUSTMENT_REQUESTED: 'bg-rose-500/10 text-rose-700',
  APPROVED_FOR_NEGOTIATION: 'bg-emerald-500/10 text-emerald-700',
  REJECTED: 'bg-luma-ink/10 text-luma-ink/60',
  CONVERTED_TO_OPERATION: 'bg-emerald-600/15 text-emerald-800',
};

export function BuyerProposalsList({ proposals }: { proposals: ProposalListItem[] }) {
  const [filter, setFilter] = useState<ProposalStatus | 'ALL'>('ALL');

  const filtered =
    filter === 'ALL' ? proposals : proposals.filter((p) => p.status === filter);

  const statusesPresent = Array.from(new Set(proposals.map((p) => p.status)));

  return (
    <div>
      {statusesPresent.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition',
              filter === 'ALL'
                ? 'bg-luma-ink text-luma-offwhite'
                : 'bg-white text-luma-ink/70 hover:text-luma-ink',
            )}
          >
            Todas / All
          </button>
          {statusesPresent.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-medium transition',
                filter === s
                  ? 'bg-luma-ink text-luma-offwhite'
                  : 'bg-white text-luma-ink/70 hover:text-luma-ink',
              )}
            >
              {STATUS_LABEL[s].pt}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-10 text-center text-sm text-luma-ink/55">
          Nenhuma proposta encontrada. / No proposals found.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/buyer/proposals/${p.reference}`}
                className="group block rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-sm transition hover:border-black/15 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12px] text-luma-ink/55">{p.reference}</p>
                    <p className="mt-1 font-display text-lg text-luma-ink">
                      {p.destinationCountry.name}
                      {p.destinationPort ? ` · ${p.destinationPort.name}` : ''}
                    </p>
                    {p.loadPlan && (
                      <p className="mt-1 text-[12.5px] text-luma-ink/60">
                        Container {p.loadPlan.containerCode} · {p.loadPlan.itemsCount} itens ·{' '}
                        {p.loadPlan.totalWeightKg.toLocaleString('pt-BR')} kg
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider',
                        STATUS_TONE[p.status],
                      )}
                    >
                      {STATUS_LABEL[p.status].pt}
                    </span>
                    <span className="text-[11px] text-luma-ink/45">
                      {p.submittedAt
                        ? new Date(p.submittedAt).toLocaleDateString('pt-BR')
                        : new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
