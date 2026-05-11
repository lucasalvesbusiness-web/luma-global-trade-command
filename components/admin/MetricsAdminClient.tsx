'use client';

import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';

const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequena',
  MEDIUM: 'Média',
  LARGE: 'Grande',
  ENTERPRISE: 'Enterprise',
};

const DELIVERY_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  REMOTE: 'Remoto',
  HYBRID: 'Híbrido',
};

const STATUS_LABELS: Record<string, string> = {
  OPENED: 'Aberto',
  SCOPED: 'Escopado',
  QUOTED: 'Cotado',
  ACCEPTED: 'Aceito',
  IN_PROGRESS: 'Em andamento',
  DELIVERED: 'Entregue',
  CONFIRMED: 'Confirmado',
  CLOSED: 'Fechado',
  DISPUTED: 'Disputa',
  CANCELLED: 'Cancelado',
};

function fmtBRL(cents: number | null): string {
  if (cents === null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function MetricsAdminClient() {
  const { data, isLoading, error } = trpc.admin.metrics.useQuery();

  return (
    <main className="mx-auto max-w-layout px-6 py-10 md:px-10">
      <header className="mb-8">
        <TechLabel dot className="mb-2">
          Admin · KPI
        </TechLabel>
        <h1 className="display-xl text-3xl text-ink-50 md:text-4xl">
          Métricas da plataforma
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Snapshot operacional · números brutos, sem filtros cosméticos.
        </p>
      </header>

      {isLoading && (
        <p className="font-mono text-xs text-ink-400">› carregando métricas…</p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
          {error.message}
        </p>
      )}

      {data && (
        <div className="flex flex-col gap-8">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Empresas" value={data.companies.total} />
            <Kpi
              label="Verificadas"
              value={`${data.companies.verified} / ${data.companies.total}`}
              hint={`${data.companies.docVerified} DOC_VERIFIED`}
            />
            <Kpi label="Usuários" value={data.users.total} hint={`${data.users.admins} admin`} />
            <Kpi
              label="Deals (total)"
              value={data.deals.total}
              hint={`${data.deals.confirmedLast30} confirmados / 30d`}
            />
            <Kpi
              label="Avg. ticket"
              value={fmtBRL(data.deals.avgQuoteCents)}
            />
            <Kpi
              label="Reviews enviadas"
              value={`${data.reviews.submitted} / ${data.reviews.total}`}
              hint={
                data.reviews.avgRating !== null
                  ? `★ ${data.reviews.avgRating.toFixed(2)}`
                  : 'sem ratings'
              }
            />
            <Kpi label="Watches" value={data.network.watches} />
            <Kpi
              label="Convites"
              value={`${data.network.invitationsAccepted} / ${data.network.invitationsSent}`}
              hint="aceitos / enviados"
            />
          </section>

          <Section title="Funil de execução">
            <FunnelBar
              steps={[
                { label: 'Abertos', value: data.deals.total },
                { label: 'Aceitos+', value: data.funnel.accepted },
                { label: 'Em andamento+', value: data.funnel.inProgress },
                { label: 'Entregues+', value: data.funnel.delivered },
                { label: 'Confirmados+', value: data.funnel.confirmed },
                { label: 'Fechados', value: data.funnel.closed },
              ]}
            />
          </Section>

          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Deals por status">
              <DistList
                rows={data.deals.byStatus.map((r) => ({
                  label: STATUS_LABELS[r.key] ?? r.key,
                  value: r.count,
                }))}
                total={data.deals.total}
              />
            </Section>

            <Section title="Empresas por porte">
              <DistList
                rows={data.companies.bySize.map((r) => ({
                  label: SIZE_LABELS[r.key] ?? r.key,
                  value: r.count,
                }))}
                total={data.companies.total}
              />
            </Section>

            <Section title="Empresas por modo de entrega">
              <DistList
                rows={data.companies.byDeliveryMode.map((r) => ({
                  label: DELIVERY_LABELS[r.key] ?? r.key,
                  value: r.count,
                }))}
                total={data.companies.total}
              />
            </Section>

            <Section title="Top estados">
              <DistList
                rows={data.companies.byState.map((r) => ({
                  label: r.key,
                  value: r.count,
                }))}
                total={data.companies.total}
              />
            </Section>
          </div>

          <Section title="Atividade">
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Eventos / 7d" value={data.activity.last7Days} />
              <Kpi label="Eventos / 30d" value={data.activity.last30Days} />
            </div>
          </Section>

          <p className="font-mono text-[10px] text-ink-500">
            gerado em {new Date(data.generatedAt).toISOString()}
          </p>
        </div>
      )}
    </main>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-white/[0.07] bg-ink-900 p-4">
      <span className="text-[10px] uppercase tracking-wider text-ink-400">{label}</span>
      <span className="display-md text-2xl text-ink-50">{value}</span>
      {hint && <span className="font-mono text-[10px] text-ink-400">{hint}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <TechLabel>{title}</TechLabel>
      <div className="rounded-md border border-white/[0.07] bg-ink-900 p-4">{children}</div>
    </section>
  );
}

function DistList({
  rows,
  total,
}: {
  rows: Array<{ label: string; value: number }>;
  total: number;
}) {
  if (rows.length === 0) {
    return <p className="font-mono text-xs text-ink-400">sem dados</p>;
  }
  return (
    <ul className="flex flex-col gap-2 font-mono text-[11px]">
      {rows.map((r) => {
        const pct = total > 0 ? (r.value / total) * 100 : 0;
        return (
          <li key={r.label} className="flex flex-col gap-1">
            <div className="flex justify-between text-ink-200">
              <span>{r.label}</span>
              <span className="text-ink-400">
                {r.value} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full bg-amber/60"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function FunnelBar({ steps }: { steps: Array<{ label: string; value: number }> }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <ul className="flex flex-col gap-2 font-mono text-[11px]">
      {steps.map((s) => {
        const pct = (s.value / max) * 100;
        return (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-ink-300">{s.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full bg-amber/60"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-ink-200">{s.value}</span>
          </li>
        );
      })}
    </ul>
  );
}
