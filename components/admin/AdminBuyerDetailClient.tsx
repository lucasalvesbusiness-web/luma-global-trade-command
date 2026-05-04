'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  Lock,
  ShieldOff,
  Unlock,
  X,
} from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

export function AdminBuyerDetailClient({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const dataQ = trpc.buyer.adminGet.useQuery({ id });
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const onSuccess = () => {
    utils.buyer.adminGet.invalidate({ id });
    utils.buyer.adminList.invalidate();
    setShowRejectForm(false);
    setRejectReason('');
  };

  const approveM = trpc.buyer.adminApprove.useMutation({ onSuccess });
  const rejectM = trpc.buyer.adminReject.useMutation({ onSuccess });
  const blockM = trpc.buyer.adminBlock.useMutation({ onSuccess });
  const unblockM = trpc.buyer.adminUnblock.useMutation({ onSuccess });

  if (dataQ.isLoading) {
    return (
      <main className="p-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      </main>
    );
  }
  if (!dataQ.data) return null;

  const c = dataQ.data;
  const status = c.approvalStatus;

  return (
    <main className="space-y-5 p-6">
      <div>
        <Link
          href="/admin/buyers"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-luma-ink/60 hover:text-luma-ink"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> Compradores
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-luma-olive" strokeWidth={1.5} />
          <h2 className="font-display text-2xl font-light text-luma-ink">
            {c.legalName}
          </h2>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]',
              status === 'PENDING' && 'bg-luma-sun/20 text-amber-800',
              status === 'APPROVED' && 'bg-luma-field/15 text-luma-field',
              status === 'REJECTED' && 'bg-red-100 text-red-700',
              status === 'BLOCKED' && 'bg-black/10 text-luma-ink/55',
            )}
          >
            {status.toLowerCase()}
          </span>
        </div>
        {c.displayName && (
          <p className="text-[12px] text-luma-ink/60">“{c.displayName}”</p>
        )}
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Tipo" value={c.type.toLowerCase()} />
        <Field label="País" value={c.country.name} />
        <Field label="Cidade" value={c.city ?? '—'} />
        <Field label="Endereço" value={c.address ?? '—'} />
        <Field label="CNPJ / VAT" value={c.taxId ?? '—'} />
        <Field label="Telefone" value={c.contactPhone ?? '—'} />
        <Field label="Incoterm padrão" value={c.defaultIncoterm ?? '—'} />
        <Field
          label="Volume mensal estimado"
          value={c.estimatedMonthlyVolume ?? '—'}
        />
        <Field
          label="Onboarding completo"
          value={
            c.onboardingCompletedAt
              ? new Date(c.onboardingCompletedAt).toLocaleDateString()
              : '—'
          }
        />
        <Field
          label="Cadastrado em"
          value={new Date(c.createdAt).toLocaleString()}
        />
      </section>

      {c.productsOfInterest.length > 0 && (
        <section>
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85">
            Produtos de interesse
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {c.productsOfInterest.map((p) => (
              <span
                key={p}
                className="rounded-full bg-luma-olive/10 px-2 py-0.5 text-[11px] text-luma-olive"
              >
                {p}
              </span>
            ))}
          </div>
        </section>
      )}

      {c.targetMarkets.length > 0 && (
        <section>
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85">
            Mercados de destino
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {c.targetMarkets.map((m) => (
              <span
                key={m}
                className="rounded-full bg-luma-olive/10 px-2 py-0.5 text-[11px] text-luma-olive"
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85">
          Contatos
        </p>
        <ul className="mt-1 space-y-1">
          {c.buyers.map((b) => (
            <li
              key={b.id}
              className="rounded-md bg-white/70 px-3 py-2 ring-1 ring-inset ring-black/5"
            >
              <p className="text-[13px] text-luma-ink">
                {b.user.name ?? b.user.email}
              </p>
              <p className="text-[11.5px] text-luma-ink/65">{b.user.email}</p>
            </li>
          ))}
        </ul>
      </section>

      {status === 'REJECTED' && c.rejectionReason && (
        <section className="rounded-md bg-red-50 p-3 ring-1 ring-inset ring-red-200">
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-red-700">
            Motivo da rejeição
          </p>
          <p className="mt-1 text-[12.5px] text-red-700">{c.rejectionReason}</p>
        </section>
      )}

      {c.approvedBy && c.approvedAt && (
        <p className="text-[11px] text-luma-ink/55">
          Decisão tomada por {c.approvedBy.name ?? c.approvedBy.email} em{' '}
          {new Date(c.approvedAt).toLocaleString()}
        </p>
      )}

      {/* ============ Ações ============ */}
      <section className="flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
        {status === 'PENDING' && (
          <>
            <button
              type="button"
              disabled={approveM.isPending}
              onClick={() => approveM.mutate({ id })}
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-field px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-[12px] font-medium text-red-700 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              Rejeitar
            </button>
          </>
        )}
        {status === 'APPROVED' && (
          <button
            type="button"
            disabled={blockM.isPending}
            onClick={() => {
              if (confirm('Bloquear acesso? O comprador perde o canvas até desbloqueio.')) {
                blockM.mutate({ id });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-[12px] font-medium text-luma-ink/75 shadow-sm ring-1 ring-inset ring-black/10 hover:text-luma-ink"
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Bloquear
          </button>
        )}
        {status === 'BLOCKED' && (
          <button
            type="button"
            disabled={unblockM.isPending}
            onClick={() => unblockM.mutate({ id })}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Unlock className="h-3.5 w-3.5" strokeWidth={1.5} />
            Desbloquear
          </button>
        )}
        {status === 'REJECTED' && (
          <button
            type="button"
            onClick={() => approveM.mutate({ id })}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-field px-4 py-2 text-[12px] font-medium text-white shadow-sm hover:opacity-90"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
            Reverter para aprovado
          </button>
        )}
      </section>

      {showRejectForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (rejectReason.trim().length < 2) return;
            rejectM.mutate({ id, reason: rejectReason.trim() });
          }}
          className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
        >
          <label className="text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85">
            Motivo da rejeição (será enviado ao comprador)
          </label>
          <textarea
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className={cn(inputCls, 'mt-1')}
          />
          {rejectM.error && (
            <p className="mt-2 text-[12px] text-red-700">{rejectM.error.message}</p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="rounded-md bg-white/80 px-3 py-1.5 text-[11.5px] font-medium text-luma-ink/75 ring-1 ring-inset ring-black/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={rejectM.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-[11.5px] font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              <ShieldOff className="h-3 w-3" strokeWidth={1.5} />
              Confirmar rejeição
            </button>
          </div>
        </form>
      )}

      {c.proposals.length > 0 && (
        <section>
          <p className="text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85">
            Últimas propostas
          </p>
          <ul className="mt-1 space-y-1">
            {c.proposals.map((p) => (
              <li
                key={p.id}
                className="rounded-md bg-white/70 px-3 py-2 text-[12px] ring-1 ring-inset ring-black/5"
              >
                <span className="font-mono">{p.reference}</span>{' '}
                <span className="text-luma-ink/55">
                  · {p.status.toLowerCase()} ·{' '}
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/60 p-2 ring-1 ring-inset ring-black/5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-luma-olive/85">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] text-luma-ink">{value}</p>
    </div>
  );
}
