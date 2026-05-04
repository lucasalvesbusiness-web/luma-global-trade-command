'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, FileDown, MessageCircle, RefreshCcw } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import type { ProposalDetail, ProposalStatus } from '@/server/repositories/types';
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

export function BuyerProposalDetail({ detail }: { detail: ProposalDetail }) {
  const router = useRouter();
  const [resubmitText, setResubmitText] = useState('');
  const resubmit = trpc.proposal.resubmit.useMutation({
    onSuccess: () => {
      setResubmitText('');
      router.refresh();
    },
  });

  const buyerVisibleNotes = detail.notes.filter(
    (n) => n.kind === 'TO_BUYER' || n.kind === 'FROM_BUYER',
  );

  const canResubmit = detail.status === 'ADJUSTMENT_REQUESTED';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/buyer/proposals"
        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.22em] text-luma-olive/85 transition hover:text-luma-olive"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        Voltar / Back
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-6 border-b border-black/5 pb-8">
        <div className="min-w-0">
          <p className="font-mono text-[12px] text-luma-ink/55">{detail.reference}</p>
          <h1 className="mt-1 font-display text-3xl font-light text-luma-ink">
            {detail.destinationCountry.name}
            {detail.destinationPort ? ` · ${detail.destinationPort.name}` : ''}
          </h1>
          <p className="mt-2 text-[13px] text-luma-ink/60">
            {detail.buyerCompany.legalName}
            {detail.incoterm ? ` · ${detail.incoterm}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider',
              STATUS_TONE[detail.status],
            )}
          >
            {STATUS_LABEL[detail.status].pt} / {STATUS_LABEL[detail.status].en}
          </span>
          <a
            href={`/api/proposals/${detail.reference}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-luma-ink/75 shadow-sm transition hover:text-luma-ink"
          >
            <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            PDF
          </a>
        </div>
      </header>

      {detail.loadPlan && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-luma-ink">Carga / Load</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-2xl border border-black/5 bg-white p-5 sm:grid-cols-4">
            <Stat label="Container" value={detail.loadPlan.containerCode} />
            <Stat label="Itens / Items" value={String(detail.loadPlan.itemsCount)} />
            <Stat label="Pallets" value={String(detail.loadPlan.totalPallets)} />
            <Stat
              label="Peso / Weight"
              value={`${detail.loadPlan.totalWeightKg.toLocaleString('pt-BR')} kg`}
            />
          </div>
        </section>
      )}

      {detail.items.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-luma-ink">
            Itens da carga / Load items
          </h2>
          <ul className="mt-3 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
            {detail.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[14px] font-medium text-luma-ink">{it.productName}</p>
                  {it.varietyName && (
                    <p className="text-[12px] text-luma-ink/55">{it.varietyName}</p>
                  )}
                </div>
                <div className="text-right text-[12.5px] text-luma-ink/70">
                  {it.qtyBoxes} cx · {it.qtyPallets} plt ·{' '}
                  {it.totalWeightKg.toLocaleString('pt-BR')} kg
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg text-luma-ink">
          <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
          Mensagens / Messages
        </h2>
        {buyerVisibleNotes.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-black/10 bg-white/50 p-6 text-center text-[13px] text-luma-ink/55">
            Nenhuma mensagem ainda. / No messages yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {buyerVisibleNotes.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'rounded-2xl border px-5 py-4',
                  n.kind === 'FROM_BUYER'
                    ? 'border-luma-olive/25 bg-luma-olive/5'
                    : 'border-black/5 bg-white',
                )}
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-luma-ink/55">
                  <span>{n.kind === 'FROM_BUYER' ? 'Você / You' : 'Equipe Luma / Luma team'}</span>
                  <span>{new Date(n.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[14px] text-luma-ink/85">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canResubmit && (
        <section className="mt-8 rounded-2xl border border-rose-500/15 bg-rose-50/50 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg text-rose-900">
            <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />
            Ajuste solicitado / Adjustment requested
          </h2>
          <p className="mt-2 text-[13px] text-rose-900/80">
            Veja a mensagem do time Luma acima. Quando estiver pronto, descreva
            os ajustes feitos e reenvie a proposta. / Read the Luma team
            message above. When ready, describe the adjustments and resubmit.
          </p>
          <textarea
            value={resubmitText}
            onChange={(e) => setResubmitText(e.target.value)}
            rows={4}
            placeholder="Descreva os ajustes feitos / Describe the adjustments..."
            className="mt-4 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] text-luma-ink placeholder:text-luma-ink/35 focus:border-luma-olive focus:outline-none"
          />
          {resubmit.error && (
            <p className="mt-2 text-[12px] text-rose-700">
              {resubmit.error.message}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={resubmit.isPending || resubmitText.trim().length < 2}
              onClick={() =>
                resubmit.mutate({
                  reference: detail.reference,
                  body: resubmitText.trim(),
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-ink px-4 py-2 text-[13px] font-medium text-luma-offwhite transition hover:bg-luma-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              {resubmit.isPending ? 'Enviando…' : 'Reenviar / Resubmit'}
            </button>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg text-luma-ink">Histórico / History</h2>
        <ul className="mt-3 space-y-2 text-[12.5px] text-luma-ink/70">
          {detail.auditTrail.map((e) => (
            <li
              key={e.id}
              className="flex items-baseline justify-between rounded-xl border border-black/5 bg-white px-4 py-2"
            >
              <span>
                {e.fromStatus ? `${e.fromStatus} → ` : ''}
                <strong className="text-luma-ink">{e.toStatus}</strong>
              </span>
              <span className="font-mono text-[11px] text-luma-ink/50">
                {new Date(e.occurredAt).toLocaleString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-luma-ink/50">{label}</p>
      <p className="mt-1 font-display text-base text-luma-ink">{value}</p>
    </div>
  );
}
