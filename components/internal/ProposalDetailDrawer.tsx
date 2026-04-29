'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Calendar,
  Container,
  FileText,
  History,
  MapPin,
  MessageSquare,
  Package,
  Send,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';
import type { ProposalStatus } from '@/server/repositories/types';

function fmt(date: Date | string, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'pt-br' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const TRANSITION_LABEL_PT: Record<string, string> = {
  'transitions.startCommercialReview': 'Iniciar análise comercial',
  'transitions.sendToOps': 'Enviar p/ operações',
  'transitions.sendToCompliance': 'Enviar p/ compliance',
  'transitions.requestAdjustment': 'Solicitar ajuste',
  'transitions.reject': 'Rejeitar',
  'transitions.backToOps': 'Voltar p/ operações',
  'transitions.approveForNegotiation': 'Aprovar p/ negociação',
  'transitions.resumeCommercial': 'Retomar análise comercial',
  'transitions.convertToOperation': 'Converter em operação',
};

export function ProposalDetailDrawer({
  proposalId,
  onClose,
}: {
  proposalId: string | null;
  onClose: () => void;
}) {
  const locale = useLocale();
  const [noteBody, setNoteBody] = useState('');
  const [noteKind, setNoteKind] = useState<'INTERNAL' | 'TO_BUYER'>('INTERNAL');
  const [pendingTransition, setPendingTransition] = useState<ProposalStatus | null>(null);

  const utils = trpc.useUtils();

  const detailQ = trpc.internal.proposalDetail.useQuery(
    proposalId ? { id: proposalId } : { id: '00000000-0000-0000-0000-000000000000' },
    { enabled: Boolean(proposalId) },
  );
  const proposal = detailQ.data;

  const transitionsQ = trpc.internal.allowedTransitions.useQuery(
    proposal ? { fromStatus: proposal.status } : { fromStatus: 'DRAFT' },
    { enabled: Boolean(proposal) },
  );

  const transitionMut = trpc.internal.transitionStatus.useMutation({
    onSuccess: async () => {
      await utils.internal.proposalDetail.invalidate();
      await utils.internal.listProposals.invalidate();
      await utils.internal.allowedTransitions.invalidate();
      setPendingTransition(null);
      setNoteBody('');
    },
  });

  const addNoteMut = trpc.internal.addNote.useMutation({
    onSuccess: async () => {
      await utils.internal.proposalDetail.invalidate();
      setNoteBody('');
    },
  });

  // Fechar com Esc
  useEffect(() => {
    if (!proposalId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [proposalId, onClose]);

  const handleTransitionClick = (to: ProposalStatus) => {
    if (!proposal) return;
    // Se tem nota escrita, incluir junto
    const note = noteBody.trim()
      ? { body: noteBody.trim(), kind: noteKind }
      : null;
    setPendingTransition(to);
    transitionMut.mutate({
      proposalId: proposal.id,
      fromStatus: proposal.status,
      toStatus: to,
      note,
    });
  };

  const handleAddNote = () => {
    if (!proposal || !noteBody.trim()) return;
    addNoteMut.mutate({
      proposalId: proposal.id,
      body: noteBody.trim(),
      kind: noteKind,
    });
  };

  return (
    <AnimatePresence>
      {proposalId && (
        <div className="fixed inset-0 z-40">
          <motion.button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-luma-ink/30 backdrop-blur-sm cursor-default"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 bottom-0 flex w-full max-w-[640px] flex-col bg-luma-offwhite shadow-2xl"
          >
            {/* Header */}
            <header className="flex items-start justify-between gap-3 border-b border-black/5 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] tabular-nums uppercase tracking-[0.22em] text-luma-olive/80">
                  {proposal?.reference ?? '—'}
                </p>
                <h2 className="mt-1 font-display text-xl font-light text-luma-ink leading-tight">
                  {proposal?.buyerCompany.displayName ??
                    proposal?.buyerCompany.legalName ??
                    '—'}
                </h2>
                <p className="mt-0.5 text-[12px] text-luma-ink/60">
                  {proposal?.destinationCountry.name}
                  {proposal?.destinationPort && ` · ${proposal.destinationPort.name}`}
                  {proposal?.incoterm && ` · ${proposal.incoterm}`}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-full bg-white/70 p-1.5 text-luma-ink/70 shadow-sm transition hover:bg-white"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </header>

            {/* Body */}
            {detailQ.isLoading && (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/50">
                  Carregando…
                </p>
              </div>
            )}

            {proposal && (
              <div className="flex-1 overflow-y-auto">
                {/* Seções compactas */}
                <Section icon={<User className="h-3 w-3" />} title="Comprador">
                  <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <Field label="Razão social" value={proposal.buyerCompany.legalName} />
                    <Field label="Tipo" value={proposal.buyerCompany.type} />
                    <Field label="Contato" value={proposal.buyerContactName ?? '—'} />
                    <Field label="E-mail" value={proposal.buyerContactEmail ?? '—'} />
                    <Field label="Cidade" value={proposal.buyerCity ?? '—'} />
                    <Field label="Endereço" value={proposal.buyerAddress ?? '—'} />
                  </dl>
                </Section>

                <Section icon={<MapPin className="h-3 w-3" />} title="Destino">
                  <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <Field label="País" value={proposal.destinationCountry.name} />
                    <Field
                      label="Porto"
                      value={
                        proposal.destinationPort
                          ? `${proposal.destinationPort.name} (${proposal.destinationPort.code ?? '—'})`
                          : '—'
                      }
                    />
                    <Field label="Incoterm" value={proposal.incoterm ?? '—'} />
                    <Field
                      label="Submetida em"
                      value={proposal.submittedAt ? fmt(proposal.submittedAt, locale) : '—'}
                    />
                  </dl>
                </Section>

                <Section icon={<Container className="h-3 w-3" />} title="Carga">
                  {proposal.loadPlan ? (
                    <>
                      <p className="text-[12.5px] text-luma-ink">
                        <span className="font-medium">
                          {proposal.loadPlan.containerCode
                            .replace(/^C_/, '')
                            .replace(/_/g, ' ')}
                        </span>
                        {proposal.loadPlan.configuredTempC !== null && (
                          <span className="text-luma-ink/60">
                            {' · '}
                            {proposal.loadPlan.configuredTempC} °C
                          </span>
                        )}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-luma-ink/70 tabular-nums">
                        <span>
                          <Package className="inline h-3 w-3 mr-1" strokeWidth={1.5} />
                          {proposal.loadPlan.totalBoxes.toLocaleString(locale)} caixas
                        </span>
                        <span>{proposal.loadPlan.totalPallets} pallets</span>
                        <span>
                          {Math.round(proposal.loadPlan.totalWeightKg).toLocaleString(
                            locale,
                          )}{' '}
                          kg
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {proposal.items.map((it) => (
                          <li
                            key={it.id}
                            className="flex items-center justify-between text-[12px] rounded-md bg-white/70 px-2.5 py-1.5 ring-1 ring-inset ring-black/5"
                          >
                            <span className="min-w-0 truncate">
                              <span className="font-medium text-luma-ink">
                                {it.productName}
                              </span>
                              {it.varietyName && (
                                <span className="text-luma-ink/55"> · {it.varietyName}</span>
                              )}
                            </span>
                            <span className="tabular-nums text-luma-ink/70">
                              {it.qtyBoxes}×{it.qtyPallets}pal
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-[12.5px] text-luma-ink/55">Sem load plan.</p>
                  )}
                </Section>

                <Section icon={<MessageSquare className="h-3 w-3" />} title="Notas">
                  {proposal.notes.length === 0 ? (
                    <p className="text-[12px] text-luma-ink/55">Sem notas ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {proposal.notes.map((n) => (
                        <li
                          key={n.id}
                          className={cn(
                            'rounded-lg px-3 py-2 ring-1 ring-inset',
                            n.kind === 'TO_BUYER'
                              ? 'bg-luma-sun/10 ring-luma-sun/30'
                              : 'bg-white/70 ring-black/5',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10.5px]">
                            <span className="font-medium text-luma-ink/80">
                              {n.authorName ?? n.authorEmail}
                            </span>
                            <span className="uppercase tracking-[0.22em] text-luma-olive/80">
                              {n.team ?? ''} ·{' '}
                              {n.kind === 'TO_BUYER' ? 'p/ comprador' : 'interna'}
                            </span>
                            <span className="text-luma-ink/45 tabular-nums">
                              {fmt(n.createdAt, locale)}
                            </span>
                          </div>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-luma-ink/85">
                            {n.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Nova nota */}
                  <div className="mt-3 space-y-2 rounded-lg bg-white/60 p-3 ring-1 ring-inset ring-black/5">
                    <textarea
                      rows={2}
                      placeholder="Escreva uma nota…"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      className="w-full resize-none rounded-md border border-black/10 bg-white/70 px-2.5 py-1.5 text-[12.5px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name="kind"
                            checked={noteKind === 'INTERNAL'}
                            onChange={() => setNoteKind('INTERNAL')}
                          />
                          Interna
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name="kind"
                            checked={noteKind === 'TO_BUYER'}
                            onChange={() => setNoteKind('TO_BUYER')}
                          />
                          Para o comprador
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={!noteBody.trim() || addNoteMut.isPending}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition',
                          noteBody.trim()
                            ? 'bg-luma-olive text-luma-offwhite hover:brightness-110'
                            : 'bg-luma-ink/10 text-luma-ink/40 cursor-not-allowed',
                        )}
                      >
                        <Send className="h-3 w-3" strokeWidth={1.75} />
                        Adicionar
                      </button>
                    </div>
                  </div>
                </Section>

                <Section icon={<History className="h-3 w-3" />} title="Audit trail">
                  {proposal.auditTrail.length === 0 ? (
                    <p className="text-[12px] text-luma-ink/55">—</p>
                  ) : (
                    <ol className="space-y-1 text-[11.5px]">
                      {proposal.auditTrail.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center gap-2 rounded-md bg-white/50 px-2.5 py-1 ring-1 ring-inset ring-black/5"
                        >
                          <Calendar className="h-3 w-3 text-luma-olive/70" strokeWidth={1.5} />
                          <span className="tabular-nums text-luma-ink/55">
                            {fmt(e.occurredAt, locale)}
                          </span>
                          <span className="text-luma-ink/80">
                            {e.fromStatus ?? '∅'} → {e.toStatus ?? '∅'}
                          </span>
                          <span className="ml-auto text-luma-ink/55">
                            {e.actorName ?? e.actorEmail ?? 'sistema'}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Section>

                <Section icon={<FileText className="h-3 w-3" />} title="Compliance">
                  <p className="text-[11.5px] text-luma-ink/55">
                    Prévia documental disponível no canvas do comprador. Validação
                    completa ocorre caso a caso.
                  </p>
                </Section>
              </div>
            )}

            {/* Footer — transições */}
            {proposal && (
              <footer className="border-t border-black/5 bg-white/60 px-5 py-3">
                <p className="text-[0.6rem] uppercase tracking-[0.28em] text-luma-olive/80 mb-2">
                  <ShieldCheck className="inline h-3 w-3 mr-1" strokeWidth={1.5} />
                  Transições disponíveis para o seu time
                </p>
                {transitionsQ.data && transitionsQ.data.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {transitionsQ.data.map((rule) => {
                      const label = TRANSITION_LABEL_PT[rule.label] ?? rule.label;
                      const tone =
                        rule.tone === 'reject'
                          ? 'bg-[hsl(var(--luma-earth)_/_0.15)] text-[hsl(var(--luma-earth))] hover:bg-[hsl(var(--luma-earth)_/_0.25)]'
                          : rule.tone === 'caution'
                            ? 'bg-[hsl(var(--luma-sun)_/_0.18)] text-[hsl(var(--luma-earth))] hover:bg-[hsl(var(--luma-sun)_/_0.3)]'
                            : rule.tone === 'close'
                              ? 'bg-luma-field/20 text-luma-olive hover:bg-luma-field/30'
                              : 'bg-luma-olive text-luma-offwhite hover:brightness-110';
                      const isPending =
                        transitionMut.isPending && pendingTransition === rule.to;
                      return (
                        <button
                          key={rule.to}
                          type="button"
                          disabled={transitionMut.isPending}
                          onClick={() => handleTransitionClick(rule.to)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-60',
                            tone,
                          )}
                        >
                          {isPending ? 'Aplicando…' : label}
                          {!isPending && (
                            <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-luma-ink/50">
                    Nenhuma transição disponível neste estado para o seu time.
                  </p>
                )}
                {transitionMut.error && (
                  <p className="mt-2 rounded-md bg-[hsl(var(--luma-earth)_/_0.1)] px-2.5 py-1.5 text-[11.5px] text-[hsl(var(--luma-earth))]">
                    {transitionMut.error.message}
                  </p>
                )}
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-black/5 px-6 py-4">
      <div className="mb-2 flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.28em] text-luma-olive/80">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.55rem] uppercase tracking-[0.2em] text-luma-ink/50">{label}</dt>
      <dd className="text-[13px] text-luma-ink truncate">{value}</dd>
    </div>
  );
}

// Helper — evita unused import warning
export const _unusedIcon = Building2;
