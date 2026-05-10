import type { ReputationSignals } from '@/server/services/reputation';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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

        {signals.confirmedDealsCount === 0 && (
          <p className="rounded-md border border-dashed border-white/15 px-3 py-2 text-xs text-ink-400">
            Reputação será exibida após o primeiro negócio confirmado.
          </p>
        )}
      </CardContent>
    </Card>
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
