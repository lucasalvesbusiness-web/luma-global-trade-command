import Link from 'next/link';
import { Camera, Package, ShoppingCart, Sprout, Warehouse } from 'lucide-react';

import { repositories } from '@/server/repositories';
import { db } from '@/lib/db';

export const metadata = { title: 'Dashboard · Admin' };

export default async function AdminDashboardPage() {
  const [products, origins, availabilities, proposals, pendingPhotos] =
    await Promise.all([
      db.product.count(),
      db.origin.count(),
      db.availability.count(),
      db.proposal.count(),
      db.fieldPhoto.count({ where: { approvedForBuyerView: false } }),
    ]);

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
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
}) {
  const card = (
    <div className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5 transition hover:bg-white">
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
