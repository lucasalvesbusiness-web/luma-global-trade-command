'use client';

import { useMemo, useState } from 'react';

import type { Company, VerificationArtifact } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type Item = VerificationArtifact & { company: Company };

const KIND_SHORT: Record<string, string> = {
  TAX_ID_CARD: 'cnpj',
  ADDRESS_PROOF: 'endereço',
  OTHER: 'outro',
};

function timestamp(d: Date | string) {
  return new Date(d).toISOString().replace('T', ' ').replace(/:\d{2}\..*$/, '');
}

export function VerificationsAdminClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const review = trpc.verification.review.useMutation();

  const filtered = useMemo(
    () => items.filter((it) => it.status === filter),
    [items, filter],
  );

  async function handleReview(id: string, status: 'APPROVED' | 'REJECTED') {
    await review.mutateAsync({ artifactId: id, status });
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status, reviewedAt: new Date() } : it)),
    );
  }

  const counts = useMemo(() => {
    return {
      PENDING: items.filter((i) => i.status === 'PENDING').length,
      APPROVED: items.filter((i) => i.status === 'APPROVED').length,
      REJECTED: items.filter((i) => i.status === 'REJECTED').length,
    };
  }, [items]);

  return (
    <main className="mx-auto max-w-layout px-6 py-10 md:px-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <TechLabel dot className="mb-2">
            Admin · console
          </TechLabel>
          <h1 className="display-xl text-3xl text-ink-50 md:text-4xl">
            Verificações documentais
          </h1>
        </div>
        <div className="font-mono text-[11px] text-ink-400">
          <span className="num-marker text-amber-glow">
            {String(counts.PENDING).padStart(3, '0')}
          </span>{' '}
          / {String(items.length).padStart(3, '0')} pendentes
        </div>
      </header>

      <div className="mb-6 flex gap-1 border-b border-white/[0.06]">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((k) => {
          const active = filter === k;
          const count = counts[k];
          const label =
            k === 'PENDING' ? 'Pendentes' : k === 'APPROVED' ? 'Aprovados' : 'Rejeitados';
          return (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-2.5 text-[11px] uppercase tracking-wider transition-colors',
                active ? 'text-amber-glow' : 'text-ink-400 hover:text-ink-200',
              )}
            >
              {label}
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
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/10 p-10 text-center text-sm text-ink-500">
          Sem itens nesta visão.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-md border border-white/[0.07] font-mono text-[12px]">
          {filtered.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-4 border-b border-white/[0.04] px-4 py-3 transition-colors last:border-b-0 hover:bg-amber/[0.04]"
            >
              <span className="w-32 shrink-0 text-[10px] text-ink-500">
                {timestamp(item.createdAt)}
              </span>
              <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-ink-400">
                {KIND_SHORT[item.kind] ?? item.kind}
              </span>
              <span className="min-w-0 flex-1 truncate font-sans text-ink-100">
                {item.company.tradeName ?? item.company.legalName}
                <span className="ml-2 text-[10px] text-ink-500">
                  CNPJ {item.company.taxId}
                </span>
              </span>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-ink-300 underline decoration-amber/30 underline-offset-4 hover:text-amber-glow"
              >
                ver artefato →
              </a>
              {item.status === 'PENDING' ? (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleReview(item.id, 'APPROVED')}
                    disabled={review.isPending}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(item.id, 'REJECTED')}
                    disabled={review.isPending}
                  >
                    Rejeitar
                  </Button>
                </div>
              ) : (
                <span
                  className={cn(
                    'rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                    item.status === 'APPROVED'
                      ? 'border-amber/40 bg-amber/10 text-amber-glow'
                      : 'border-white/10 bg-ink-800 text-ink-400',
                  )}
                >
                  {item.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
