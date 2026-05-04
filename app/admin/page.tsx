import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Camera,
  Package,
  ShoppingCart,
  Sprout,
  Warehouse,
} from 'lucide-react';

import { repositories } from '@/server/repositories';
import { db } from '@/lib/db';
import { computeRoutineStatus } from '@/lib/routines/status';

export const metadata = { title: 'Dashboard · Admin' };

export default async function AdminDashboardPage() {
  const [
    products,
    origins,
    availabilities,
    proposals,
    pendingPhotos,
    pendingBuyers,
    plotsForRoutines,
  ] = await Promise.all([
    db.product.count(),
    db.origin.count(),
    db.availability.count(),
    db.proposal.count(),
    db.fieldPhoto.count({ where: { approvedForBuyerView: false } }),
    db.buyerCompany.count({ where: { approvalStatus: 'PENDING' } }),
    db.fieldPlot.findMany({
      include: {
        routine: true,
        submissions: { orderBy: { submittedAt: 'desc' }, take: 1 },
      },
    }),
  ]);

  const now = new Date();
  let overdueRoutines = 0;
  for (const p of plotsForRoutines) {
    const last = p.submissions[0]?.submittedAt ?? null;
    const snap = computeRoutineStatus(
      p.routine ? { cadenceDays: p.routine.cadenceDays, active: p.routine.active } : null,
      last,
      now,
    );
    if (snap.status === 'OVERDUE') overdueRoutines++;
  }

  const proposalStatusCounts = await db.proposal.groupBy({
    by: ['status'],
    _count: true,
  });

  const recentProposals = await repositories.proposal.list();
  const latest = recentProposals.slice(0, 5);

  return (
    <main className="p-6 space-y-6">
      <section>
        <h2 className="text-[0.62rem] uppercase tracking-[0.32em] text-luma-olive/80">
          Visão geral
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Counter
            icon={<Package className="h-3.5 w-3.5" />}
            label="Produtos"
            value={products}
            href="/admin/products"
          />
          <Counter
            icon={<Sprout className="h-3.5 w-3.5" />}
            label="Origens"
            value={origins}
            href="/admin/origins"
          />
          <Counter
            icon={<Warehouse className="h-3.5 w-3.5" />}
            label="Disponibilidades"
            value={availabilities}
            href="/admin/availability"
          />
          <Counter
            icon={<ShoppingCart className="h-3.5 w-3.5" />}
            label="Propostas"
            value={proposals}
            href="/internal/proposals"
          />
          <Counter
            icon={<Camera className="h-3.5 w-3.5" />}
            label="Fotos pendentes"
            value={pendingPhotos}
            href="/admin/photos"
            tone={pendingPhotos > 0 ? 'warn' : undefined}
          />
          <Counter
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Aguardando aprovação"
            value={pendingBuyers}
            href="/admin/buyers"
            tone={pendingBuyers > 0 ? 'warn' : undefined}
          />
          <Counter
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            label="Rotinas atrasadas"
            value={overdueRoutines}
            href="/admin/origins"
            tone={overdueRoutines > 0 ? 'alarm' : undefined}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white/70 p-5 ring-1 ring-inset ring-black/5">
          <h3 className="text-[0.62rem] uppercase tracking-[0.3em] text-luma-olive/80">
            Propostas por status
          </h3>
          <ul className="mt-3 space-y-1">
            {proposalStatusCounts.length === 0 && (
              <li className="text-[12.5px] text-luma-ink/55">Sem propostas ainda.</li>
            )}
            {proposalStatusCounts.map((row) => (
              <li
                key={row.status}
                className="flex items-center justify-between rounded-md bg-luma-sand/30 px-3 py-1.5 text-[12.5px]"
              >
                <span className="text-luma-ink/80">
                  {row.status.replaceAll('_', ' ').toLowerCase()}
                </span>
                <span className="font-mono tabular-nums text-luma-ink">
                  {row._count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white/70 p-5 ring-1 ring-inset ring-black/5">
          <div className="flex items-center justify-between">
            <h3 className="text-[0.62rem] uppercase tracking-[0.3em] text-luma-olive/80">
              Últimas propostas
            </h3>
            <Link
              href="/internal/proposals"
              className="text-[11px] uppercase tracking-[0.22em] text-luma-olive hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <ul className="mt-3 space-y-1">
            {latest.length === 0 && (
              <li className="text-[12.5px] text-luma-ink/55">—</li>
            )}
            {latest.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-md bg-luma-sand/30 px-3 py-1.5 text-[12.5px]"
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-mono text-[11px] text-luma-olive mr-2">
                    {p.reference}
                  </span>
                  {p.buyerCompany.displayName ?? p.buyerCompany.legalName}
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.2em] text-luma-ink/55">
                  {p.status.replaceAll('_', ' ').toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

function Counter({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  tone?: 'warn' | 'alarm';
}) {
  const ring =
    tone === 'alarm'
      ? 'ring-rose-500/30 bg-rose-50/70'
      : tone === 'warn'
        ? 'ring-amber-500/30 bg-amber-50/70'
        : 'ring-black/5 bg-white/70';
  const card = (
    <div className={`rounded-xl p-4 ring-1 ring-inset transition hover:brightness-105 ${ring}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-luma-olive/80">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-2xl font-light tabular-nums text-luma-ink">
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
