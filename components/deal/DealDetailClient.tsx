'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { AuditEvent } from '@prisma/client';
import type { DealRoomStatus, DealTemplate } from '@/lib/types/enums';
import type { DealRoomWithRelations } from '@/server/repositories/prisma/deal-room';
import { allowedNextStates, findTransition } from '@/server/services/deal-room-transitions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TechLabel } from '@/components/ui/TechLabel';
import { dealRoomStatusLabels, dealTemplateLabels } from '@/lib/status/enums';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/react';
import { AuditLog } from './AuditLog';
import { EvidenceGrid } from './EvidenceGrid';
import { FSMStepper } from './FSMStepper';
import { MessageThread } from './MessageThread';
import { ScopeRender } from './ScopeRender';

type Role = 'BUYER' | 'SUPPLIER';
type Tab = 'scope' | 'evidence' | 'messages';

const STATUS_LABELS_PT = Object.fromEntries(
  Object.entries(dealRoomStatusLabels).map(([k, v]) => [k, v['pt-br']]),
) as Record<DealRoomStatus, string>;

export function DealDetailClient({
  deal,
  viewerRole,
  viewerCompanyId,
  viewerUserId,
  events,
}: {
  deal: DealRoomWithRelations;
  viewerRole: Role;
  viewerCompanyId: string;
  viewerUserId: string;
  events: AuditEvent[];
}) {
  const router = useRouter();
  const transition = trpc.dealRoom.transition.useMutation();
  const [tab, setTab] = useState<Tab>('scope');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const counterparty = viewerRole === 'BUYER' ? deal.supplierCompany : deal.buyerCompany;
  const dealStatus = deal.status as DealRoomStatus;
  const nextStates = allowedNextStates(dealStatus).filter((to) => {
    const t = findTransition(dealStatus, to);
    return t && (t.actor === 'EITHER' || t.actor === viewerRole);
  });

  async function fireTransition(to: DealRoomStatus, extra?: { quoteCents?: number }) {
    setError(null);
    try {
      await transition.mutateAsync({ id: deal.id, to, patch: extra });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <div className="flex h-screen flex-col bg-spectre-carbon">
      {/* Top strip */}
      <header className="border-b border-white/[0.06] bg-ink-900/60 px-6 py-4 backdrop-blur">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/d"
              className="mb-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-500 hover:text-ink-200"
            >
              ← deals
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="display-md text-xl text-ink-50 md:text-2xl">{deal.title}</h1>
              <span className="rounded-sm border border-white/10 bg-ink-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-300">
                {dealTemplateLabels[deal.template]?.['pt-br']}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-400">
              {viewerRole === 'BUYER' ? 'Comprando de' : 'Vendendo para'}{' '}
              <Link
                href={`/c/${counterparty.slug}`}
                className="text-ink-200 underline decoration-amber/40 underline-offset-2 hover:text-amber-glow"
              >
                {counterparty.tradeName ?? counterparty.legalName}
              </Link>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <TechLabel className="text-[9px]">{deal.id.slice(-12)}</TechLabel>
            {deal.quoteCents !== null && deal.quoteCents !== undefined && (
              <p className="num-marker text-2xl font-medium text-amber-glow md:text-3xl">
                {(deal.quoteCents / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: deal.quoteCurrency ?? 'BRL',
                })}
              </p>
            )}
          </div>
        </div>

        <FSMStepper status={dealStatus} />
      </header>

      {/* 3-col body */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* LEFT — audit log */}
        <aside className="hidden border-r border-white/[0.05] px-3 py-5 lg:block">
          <AuditLog events={events} />
        </aside>

        {/* CENTER — tabs */}
        <section className="flex min-w-0 min-h-0 flex-col overflow-hidden">
          <nav className="flex border-b border-white/[0.05]">
            {(
              [
                { id: 'scope', label: 'Escopo' },
                { id: 'evidence', label: `Evidências · ${deal.evidences.length}` },
                { id: 'messages', label: 'Mensagens' },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id as Tab)}
                  className={cn(
                    'relative px-5 py-3 text-[11px] uppercase tracking-wider transition-colors',
                    active ? 'text-amber-glow' : 'text-ink-400 hover:text-ink-200',
                  )}
                >
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-amber" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {tab === 'scope' && (
              <>
                <ScopeRender
                  template={deal.template as DealTemplate}
                  payload={deal.scopePayload}
                />
                {deal.cycles.length > 0 && (
                  <div className="mt-10 border-t border-white/[0.05] pt-6">
                    <TechLabel className="mb-4">
                      Ciclos de entrega · {deal.cycles.length}
                    </TechLabel>
                    <ul className="space-y-2">
                      {deal.cycles.map((cy) => (
                        <li
                          key={cy.id}
                          className="flex items-center justify-between rounded-md border border-white/[0.07] bg-ink-850/50 px-3 py-2"
                        >
                          <span className="num-marker text-xs">
                            #{String(cy.ordinal).padStart(2, '0')}
                            {cy.scheduledAt && (
                              <span className="ml-3 text-ink-500">
                                {new Date(cy.scheduledAt).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </span>
                          <Badge
                            variant={
                              cy.status === 'CONFIRMED'
                                ? 'verified'
                                : cy.status === 'CANCELLED'
                                  ? 'muted'
                                  : 'outline'
                            }
                          >
                            {cy.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {tab === 'evidence' && (
              <EvidenceGrid
                dealRoomId={deal.id}
                evidences={deal.evidences}
                onChanged={() => router.refresh()}
              />
            )}
            {tab === 'messages' && (
              <MessageThread
                dealRoomId={deal.id}
                viewerCompanyId={viewerCompanyId}
                viewerUserId={viewerUserId}
              />
            )}
          </div>
        </section>

        {/* RIGHT — actions */}
        <aside className="border-t border-white/[0.05] bg-ink-900/40 px-5 py-5 lg:border-l lg:border-t-0">
          <TechLabel dot className="mb-4">
            Ações disponíveis
          </TechLabel>

          {nextStates.length === 0 ? (
            <p className="text-xs text-ink-500">
              Nada para você fazer neste estado. Aguarde a contraparte.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {nextStates.includes('QUOTED') && viewerRole === 'SUPPLIER' && (
                <div className="rounded-md border border-amber/30 bg-amber/[0.05] p-3">
                  <Label htmlFor="quote">Cotação (R$)</Label>
                  <Input
                    id="quote"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="mt-2"
                  />
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={!quoteAmount || transition.isPending}
                    onClick={() =>
                      fireTransition('QUOTED', {
                        quoteCents: Math.round(Number(quoteAmount) * 100),
                      })
                    }
                  >
                    Enviar cotação →
                  </Button>
                </div>
              )}

              {nextStates
                .filter((s) => !(s === 'QUOTED' && viewerRole === 'SUPPLIER'))
                .map((to, idx) => {
                  const isPositive = !['CANCELLED', 'DISPUTED'].includes(to);
                  const isPrimary = idx === 0 && isPositive;
                  return (
                    <Button
                      key={to}
                      variant={isPrimary ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => fireTransition(to)}
                      disabled={transition.isPending}
                      className="w-full justify-between"
                    >
                      <span>{STATUS_LABELS_PT[to] ?? to}</span>
                      <span>→</span>
                    </Button>
                  );
                })}

              {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[10px] text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
