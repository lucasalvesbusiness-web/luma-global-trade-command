'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';

import { trpc } from '@/lib/trpc/react';
import { kanbanColumns, teamRelevantStatuses } from '@/server/services/proposal-workflow';
import type { ProposalListItem, ProposalStatus, StaffTeam } from '@/server/repositories/types';
import { cn } from '@/lib/utils';

import { ProposalCard } from './ProposalCard';
import { ProposalDetailDrawer } from './ProposalDetailDrawer';

const STATUS_LABEL_PT: Record<ProposalStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviadas',
  UNDER_COMMERCIAL_REVIEW: 'Análise comercial',
  UNDER_OPERATIONAL_REVIEW: 'Análise operacional',
  DOCUMENTATION_REVIEW_REQUIRED: 'Revisão documental',
  ADJUSTMENT_REQUESTED: 'Ajuste solicitado',
  APPROVED_FOR_NEGOTIATION: 'Aprovadas para negociação',
  REJECTED: 'Rejeitadas',
  CONVERTED_TO_OPERATION: 'Em operação',
};

const STATUS_LABEL_EN: Record<ProposalStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_COMMERCIAL_REVIEW: 'Commercial review',
  UNDER_OPERATIONAL_REVIEW: 'Operational review',
  DOCUMENTATION_REVIEW_REQUIRED: 'Documentation review',
  ADJUSTMENT_REQUESTED: 'Adjustment requested',
  APPROVED_FOR_NEGOTIATION: 'Approved for negotiation',
  REJECTED: 'Rejected',
  CONVERTED_TO_OPERATION: 'In operation',
};

type TeamFilter = 'ALL' | StaffTeam;

const TEAM_FILTERS: { value: TeamFilter; labelPt: string; labelEn: string }[] = [
  { value: 'ALL', labelPt: 'Todas', labelEn: 'All' },
  { value: 'COMMERCIAL', labelPt: 'Comercial', labelEn: 'Commercial' },
  { value: 'OPERATIONS', labelPt: 'Operações', labelEn: 'Operations' },
  { value: 'COMPLIANCE', labelPt: 'Compliance', labelEn: 'Compliance' },
];

export function ProposalKanban() {
  const locale = useLocale();
  const l = locale === 'pt-br' ? 'pt' : 'en';
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const proposalsQ = trpc.internal.listProposals.useQuery(undefined, {
    refetchInterval: 10_000, // polling suave — gate de UX adequada no MVP
  });

  const proposals = useMemo(() => proposalsQ.data ?? [], [proposalsQ.data]);

  // Filtragem por time — status relevantes do time selecionado
  const filtered = useMemo(() => {
    if (teamFilter === 'ALL') return proposals;
    const relevant = teamRelevantStatuses[teamFilter as StaffTeam] ?? [];
    return proposals.filter((p) => relevant.includes(p.status));
  }, [proposals, teamFilter]);

  // Agrupa por status
  const byStatus = useMemo(() => {
    const m = new Map<ProposalStatus, ProposalListItem[]>();
    for (const col of kanbanColumns) m.set(col, []);
    for (const p of filtered) {
      const bucket = m.get(p.status);
      if (bucket) bucket.push(p);
    }
    return m;
  }, [filtered]);

  const statusLabel = (s: ProposalStatus) =>
    (l === 'pt' ? STATUS_LABEL_PT : STATUS_LABEL_EN)[s];

  return (
    <>
      <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {TEAM_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTeamFilter(f.value)}
              className={cn(
                'rounded-full px-3 py-1 text-[11.5px] font-medium transition ring-1 ring-inset',
                teamFilter === f.value
                  ? 'bg-luma-olive text-luma-offwhite ring-luma-olive'
                  : 'bg-white/60 text-luma-ink/70 ring-black/5 hover:bg-white',
              )}
            >
              {l === 'pt' ? f.labelPt : f.labelEn}
            </button>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-luma-ink/55">
          {proposalsQ.isLoading
            ? (l === 'pt' ? 'Carregando…' : 'Loading…')
            : `${filtered.length} ${l === 'pt' ? 'propostas' : 'proposals'}`}
        </p>
      </div>

      <div className="overflow-x-auto px-6 pb-6">
        <div className="flex gap-3 min-w-max">
          {kanbanColumns.map((status) => {
            const items = byStatus.get(status) ?? [];
            return (
              <section
                key={status}
                className="flex flex-col w-[280px] shrink-0 rounded-2xl bg-white/50 ring-1 ring-inset ring-black/5"
              >
                <header className="flex items-center justify-between px-3 py-2.5 border-b border-black/5">
                  <p className="text-[11px] font-medium text-luma-ink/85">
                    {statusLabel(status)}
                  </p>
                  <span className="rounded-full bg-luma-olive/10 px-2 py-0.5 text-[10px] tabular-nums text-luma-olive">
                    {items.length}
                  </span>
                </header>
                <div className="flex-1 space-y-2 p-2 max-h-[calc(100vh-230px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-[11px] text-luma-ink/40">
                      —
                    </p>
                  ) : (
                    items.map((p) => (
                      <ProposalCard
                        key={p.id}
                        proposal={p}
                        onClick={() => setSelectedId(p.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ProposalDetailDrawer
        proposalId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
