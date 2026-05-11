import type { ReputationSignals, TicketBand } from '@/server/services/reputation';
import { TICKET_BAND_LABELS } from '@/server/services/reputation';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const SIZE_LABELS: Record<string, string> = {
  SMALL: 'Pequena',
  MEDIUM: 'Média',
  LARGE: 'Grande',
  ENTERPRISE: 'Enterprise',
};

export function ReputationBadge({ signals }: { signals: ReputationSignals }) {
  const ratingDisplay =
    signals.avgRating !== null ? signals.avgRating.toFixed(1) : '—';
  const disputePct = (signals.disputeRate * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputação</CardTitle>
        <p className="text-xs text-ink-300">
          Sinais derivados de execução real, não de marketing.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <Row label="Negócios concluídos" value={signals.confirmedDealsCount} />
        <Row
          label="Avaliação média"
          value={
            <span>
              {ratingDisplay}
              {signals.totalReviews > 0 && (
                <span className="ml-1 text-xs text-ink-400">
                  ({signals.totalReviews})
                </span>
              )}
            </span>
          }
        />
        <Row
          label="Clientes recorrentes"
          value={signals.recurringClientsCount}
          hint="Contrapartes com 2+ negócios concluídos"
        />
        <Row
          label="Incidência de disputa"
          value={
            <Badge variant={signals.disputeRate > 0.1 ? 'warning' : 'verified'}>
              {signals.disputedCount === 0 ? 'sem disputas' : `${disputePct}%`}
            </Badge>
          }
        />

        {signals.avgCycleDays !== null && (
          <Row
            label="Ciclo médio"
            value={`${signals.avgCycleDays.toFixed(1)} dias`}
            hint="Da abertura ao confirmado"
          />
        )}

        {signals.confirmedDealsCount === 0 && (
          <p className="rounded-md border border-dashed border-white/15 px-3 py-2 text-xs text-ink-400">
            Reputação será exibida após o primeiro negócio confirmado.
          </p>
        )}

        {signals.reputationByCategory.length > 0 && (
          <BreakdownSection
            title="Por categoria"
            rows={signals.reputationByCategory
              .slice(0, 5)
              .map((b) => ({ label: b.key, ...b }))}
          />
        )}

        {signals.reputationByTicketBand.length > 0 && (
          <BreakdownSection
            title="Por faixa de ticket"
            rows={signals.reputationByTicketBand.map((b) => ({
              label: TICKET_BAND_LABELS[b.key as TicketBand],
              ...b,
            }))}
          />
        )}

        {signals.reputationByCounterpartySize.length > 0 && (
          <BreakdownSection
            title="Por porte do cliente"
            rows={signals.reputationByCounterpartySize.map((b) => ({
              label: SIZE_LABELS[b.key] ?? b.key,
              ...b,
            }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; deals: number; avgRating: number | null; reviewCount: number }>;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-white/[0.05] pt-3">
      <span className="text-[10px] uppercase tracking-wider text-ink-400">{title}</span>
      <ul className="flex flex-col gap-1 font-mono text-[11px]">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="text-ink-200">{r.label}</span>
            <span className="flex items-center gap-3 text-ink-400">
              <span>{r.deals} deals</span>
              <span>
                {r.avgRating !== null ? `★ ${r.avgRating.toFixed(1)}` : '★ —'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-ink-200">{label}</span>
        {hint && <span className="text-xs text-ink-400">{hint}</span>}
      </div>
      <span className="font-medium">{value}</span>
    </div>
  );
}
