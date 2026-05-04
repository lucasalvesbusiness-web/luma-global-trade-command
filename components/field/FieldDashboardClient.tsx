'use client';

import Link from 'next/link';
import { Camera, ChevronRight, Sprout } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  UP_TO_DATE: { label: 'Em dia', cls: 'bg-luma-field/15 text-luma-field' },
  DUE_SOON: { label: 'Vence em breve', cls: 'bg-luma-sun/20 text-amber-800' },
  OVERDUE: { label: 'Atrasada', cls: 'bg-red-100 text-red-700' },
  PAUSED: { label: 'Pausada', cls: 'bg-black/5 text-luma-ink/55' },
  NEVER_SUBMITTED: {
    label: 'Aguardando 1ª submissão',
    cls: 'bg-luma-olive/10 text-luma-olive',
  },
};

export function FieldDashboardClient({ slug }: { slug: string }) {
  const dataQ = trpc.field.myOrigin.useQuery();

  if (dataQ.isLoading) {
    return (
      <main className="p-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      </main>
    );
  }

  if (dataQ.error) {
    return (
      <main className="p-6">
        <p className="text-[12px] text-red-700">{dataQ.error.message}</p>
      </main>
    );
  }

  if (!dataQ.data) return null;

  const o = dataQ.data;

  // Slug guard: se o operador acessou um slug que não é o dele, redireciona
  if (o.slug !== slug) {
    if (typeof window !== 'undefined') {
      window.location.replace(`/field/${o.slug}`);
    }
    return null;
  }

  const totalPending = o.plots.filter(
    (p) => p.status === 'OVERDUE' || p.status === 'DUE_SOON' || p.status === 'NEVER_SUBMITTED',
  ).length;

  return (
    <main className="space-y-5 p-6">
      <section>
        <div className="flex items-baseline gap-3">
          <Sprout className="h-5 w-5 text-luma-olive" strokeWidth={1.5} />
          <h2 className="font-display text-2xl font-light text-luma-ink">
            {o.name}
          </h2>
        </div>
        <p className="mt-1 text-[12px] text-luma-ink/60">
          {o.region} · {o.plots.length} talhões ·{' '}
          {totalPending > 0 ? (
            <span className="text-amber-800">
              {totalPending} talh{totalPending === 1 ? 'ão' : 'ões'} aguardando submissão
            </span>
          ) : (
            <span className="text-luma-field">Tudo em dia</span>
          )}
        </p>
      </section>

      <ul className="space-y-2">
        {o.plots.map((p) => {
          const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.NEVER_SUBMITTED!;
          const isUrgent =
            p.status === 'OVERDUE' || p.status === 'NEVER_SUBMITTED';
          return (
            <li
              key={p.id}
              className={cn(
                'rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5',
                isUrgent && 'ring-red-200',
              )}
            >
              <Link
                href={`/field/${slug}/${p.id}`}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-medium text-luma-ink">
                      {p.name}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]',
                        badge.cls,
                      )}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-luma-ink/65">
                    {p.crop}
                    {p.areaHa ? ` · ${p.areaHa} ha` : ''}
                    {p.routine
                      ? ` · cadência ${p.routine.cadenceDays}d, mín. ${p.routine.minPhotosPerCycle} fotos`
                      : ''}
                  </p>
                  {p.lastSubmission && (
                    <p className="mt-0.5 text-[10.5px] text-luma-ink/55">
                      Última: {new Date(p.lastSubmission.submittedAt).toLocaleDateString()}
                      {' · '}
                      {p.lastSubmission.photoCount} fotos
                    </p>
                  )}
                  {p.routine?.instructions && (
                    <p className="mt-1 text-[11px] italic text-luma-ink/65">
                      “{p.routine.instructions}”
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-luma-olive/10 px-2.5 py-1 text-[11px] font-medium text-luma-olive">
                    <Camera className="h-3 w-3" strokeWidth={1.5} />
                    Submeter
                  </span>
                  <ChevronRight
                    className="h-4 w-4 text-luma-ink/40"
                    strokeWidth={1.5}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
