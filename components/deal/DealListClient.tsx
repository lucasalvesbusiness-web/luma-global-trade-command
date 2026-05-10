'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { DealRoomWithRelations } from '@/server/repositories/prisma/deal-room';
import type { DealRoomStatus } from '@/lib/types/enums';
import { StatusChip } from '@/components/ui/StatusChip';
import { TechLabel } from '@/components/ui/TechLabel';
import { dealTemplateLabels } from '@/lib/status/enums';
import { cn } from '@/lib/utils';

type Role = 'BUYER' | 'SUPPLIER';
type DealRow = DealRoomWithRelations & { viewerRole: Role };
type Tab = 'all' | 'in_progress' | 'waiting_you' | 'done';

const IN_PROGRESS_STATES: DealRoomStatus[] = [
  'OPENED',
  'SCOPED',
  'QUOTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'DELIVERED',
];
const DONE_STATES: DealRoomStatus[] = ['CONFIRMED', 'CLOSED', 'CANCELLED'];

function isWaitingYou(status: DealRoomStatus, role: Role) {
  if (status === 'OPENED') return true;
  if (status === 'SCOPED' && role === 'SUPPLIER') return true;
  if (status === 'QUOTED' && role === 'BUYER') return true;
  if (status === 'DELIVERED' && role === 'BUYER') return true;
  return false;
}

export function DealListClient({
  deals,
  pendingReviewsCount,
}: {
  deals: DealRow[];
  pendingReviewsCount: number;
}) {
  const [tab, setTab] = useState<Tab>('all');

  const counts = useMemo(() => {
    const inProg = deals.filter((d) =>
      IN_PROGRESS_STATES.includes(d.status as DealRoomStatus),
    ).length;
    const waiting = deals.filter((d) =>
      isWaitingYou(d.status as DealRoomStatus, d.viewerRole),
    ).length;
    const done = deals.filter((d) => DONE_STATES.includes(d.status as DealRoomStatus)).length;
    return { all: deals.length, in_progress: inProg, waiting_you: waiting, done };
  }, [deals]);

  const filtered = useMemo(() => {
    if (tab === 'all') return deals;
    if (tab === 'in_progress')
      return deals.filter((d) => IN_PROGRESS_STATES.includes(d.status as DealRoomStatus));
    if (tab === 'done')
      return deals.filter((d) => DONE_STATES.includes(d.status as DealRoomStatus));
    return deals.filter((d) => isWaitingYou(d.status as DealRoomStatus, d.viewerRole));
  }, [tab, deals]);

  return (
    <main className="mx-auto max-w-layout px-6 py-10 md:px-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <TechLabel dot className="mb-2">
            Deal rooms
          </TechLabel>
          <h1 className="display-xl text-3xl text-ink-50 md:text-4xl">Seus negócios</h1>
        </div>
      </header>

      {pendingReviewsCount > 0 && (
        <Link
          href="/inbox"
          className="mb-6 flex items-center justify-between gap-4 rounded-md border border-amber/30 bg-amber/[0.06] px-4 py-3 transition-colors hover:bg-amber/[0.12]"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-amber-pulse rounded-full bg-amber" />
            <TechLabel className="text-amber-glow">Pendência</TechLabel>
            <span className="text-sm text-ink-100">
              <span className="num-marker text-base text-amber-glow">
                {String(pendingReviewsCount).padStart(2, '0')}
              </span>{' '}
              avaliação(ões) aguardando você
            </span>
          </div>
          <span className="text-amber-glow">→</span>
        </Link>
      )}

      {/* Tabs */}
      <nav className="mb-6 flex gap-1 border-b border-white/[0.06]">
        {(
          [
            { id: 'all', label: 'Todos' },
            { id: 'in_progress', label: 'Em andamento' },
            { id: 'waiting_you', label: 'Aguardando você' },
            { id: 'done', label: 'Concluídos' },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          const count = counts[t.id as Tab];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-wider transition-colors',
                active ? 'text-amber-glow' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'num-marker text-[10px]',
                  active ? 'text-amber/70' : 'text-ink-500',
                )}
              >
                {String(count).padStart(2, '0')}
              </span>
              {active && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-px bg-amber" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Dense list */}
      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/10 p-10 text-center text-sm text-ink-500">
          {tab === 'all'
            ? 'Nenhum deal aberto. Use /explore para encontrar empresas e abrir um deal.'
            : 'Nenhum deal nesta visão.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-white/[0.07]">
          <div className="grid grid-cols-12 gap-3 border-b border-white/[0.06] bg-ink-900/60 px-4 py-2.5 text-[10px] uppercase tracking-wider text-ink-400">
            <div className="col-span-2">Data</div>
            <div className="col-span-4">Título</div>
            <div className="col-span-3">Contraparte</div>
            <div className="col-span-1">Modal.</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Valor</div>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {filtered.map((d) => {
              const cp = d.viewerRole === 'BUYER' ? d.supplierCompany : d.buyerCompany;
              const cpName = cp.tradeName ?? cp.legalName;
              const date = d.confirmedAt ?? d.acceptedAt ?? d.openedAt;
              return (
                <li key={d.id}>
                  <Link
                    href={`/d/${d.id}`}
                    className="grid grid-cols-12 items-center gap-3 px-4 py-3 font-mono text-[12px] transition-colors hover:bg-amber/[0.04]"
                  >
                    <div className="col-span-2 text-ink-400 text-[11px]">
                      {new Date(date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </div>
                    <div className="col-span-4 truncate text-ink-100">
                      <span className="font-sans">{d.title}</span>
                      <span className="ml-2 text-[10px] text-ink-500">
                        {d.viewerRole === 'BUYER' ? '↓' : '↑'}
                      </span>
                    </div>
                    <div className="col-span-3 truncate text-ink-300">{cpName}</div>
                    <div className="col-span-1 text-[10px] text-ink-500">
                      {(dealTemplateLabels[d.template]?.['pt-br'] ?? d.template)
                        .substring(0, 10)
                        .toLowerCase()}
                    </div>
                    <div className="col-span-1">
                      <StatusChip kind="dealRoom" value={d.status} />
                    </div>
                    <div className="col-span-1 text-right text-ink-200">
                      {d.quoteCents !== null && d.quoteCents !== undefined
                        ? (d.quoteCents / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: d.quoteCurrency ?? 'BRL',
                            maximumFractionDigits: 0,
                          })
                        : '—'}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
