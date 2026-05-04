'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Building2, ChevronRight } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Pendentes',
  APPROVED: 'Aprovados',
  REJECTED: 'Rejeitados',
  BLOCKED: 'Bloqueados',
};

const STATUS_BADGE: Record<Status, string> = {
  PENDING: 'bg-luma-sun/20 text-amber-800',
  APPROVED: 'bg-luma-field/15 text-luma-field',
  REJECTED: 'bg-red-100 text-red-700',
  BLOCKED: 'bg-black/10 text-luma-ink/55',
};

const TABS: Status[] = ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'];

export function AdminBuyersClient() {
  const [tab, setTab] = useState<Status>('PENDING');
  const listQ = trpc.buyer.adminList.useQuery({ status: tab });

  return (
    <main className="space-y-4 p-6">
      <div>
        <h2 className="font-display text-xl font-light text-luma-ink">
          Compradores
        </h2>
        <p className="text-[12px] text-luma-ink/60">
          Cadastros de empresas compradoras. Aprove ou rejeite manualmente para
          liberar acesso ao canvas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[11.5px] font-medium ring-1 ring-inset transition',
              tab === t
                ? 'bg-luma-olive text-white ring-luma-olive'
                : 'bg-white/70 text-luma-ink/75 ring-black/10 hover:text-luma-ink',
            )}
          >
            {STATUS_LABEL[t]}
          </button>
        ))}
      </div>

      {listQ.isLoading && (
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      )}

      <ul className="space-y-2">
        {listQ.data?.map((c) => (
          <li
            key={c.id}
            className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
          >
            <Link
              href={`/admin/buyers/${c.id}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-luma-olive/10">
                  <Building2 className="h-4 w-4 text-luma-olive" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-medium text-luma-ink">
                      {c.legalName}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]',
                        STATUS_BADGE[c.approvalStatus as Status],
                      )}
                    >
                      {c.approvalStatus.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-luma-ink/60">
                    {c.country.name} · {c.type.toLowerCase()} ·{' '}
                    {c.proposalCount} propostas
                  </p>
                  {c.primaryContact && (
                    <p className="mt-0.5 text-[11px] text-luma-ink/55">
                      {c.primaryContact.name ?? c.primaryContact.email} ·{' '}
                      {c.primaryContact.email}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10.5px] text-luma-ink/45">
                    Solicitado em {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ChevronRight
                className="h-4 w-4 text-luma-ink/40"
                strokeWidth={1.5}
              />
            </Link>
          </li>
        ))}
        {listQ.data && listQ.data.length === 0 && (
          <li className="rounded-xl bg-white/50 p-6 text-center text-[12px] text-luma-ink/60">
            Nenhum comprador {STATUS_LABEL[tab].toLowerCase()}.
          </li>
        )}
      </ul>
    </main>
  );
}
