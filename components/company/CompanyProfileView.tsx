import Link from 'next/link';

import type { CompanyWithRelations } from '@/server/repositories/interfaces';
import type { Counterparty } from '@/components/canvas/ProfileNetworkCanvas';
import type { ReputationSignals } from '@/server/services/reputation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChapterDivider } from '@/components/ui/ChapterDivider';
import { CompanyMapLazy } from '@/components/canvas/CompanyMapLazy';
import { OpenDealDialog } from '@/components/deal/OpenDealDialog';
import { ProfileNetworkCanvas } from '@/components/canvas/ProfileNetworkCanvas';
import { PublicNav } from '@/components/system/PublicNav';
import { StatusChip } from '@/components/ui/StatusChip';
import { TechLabel } from '@/components/ui/TechLabel';
import { WatchButton } from '@/components/company/WatchButton';
import { dealTemplateLabels } from '@/lib/status/enums';

type DealHistoryRow = {
  id: string;
  template: string;
  status: string;
  buyerCompanyId: string;
  supplierCompanyId: string;
  confirmedAt: Date | null;
  closedAt: Date | null;
  counterparty: { slug: string; legalName: string; tradeName: string | null };
};

function formatYearMonth(d: Date | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
}

function timeOnNetwork(createdAt: Date) {
  const months = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
  );
  if (months < 1) return 'novo';
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  return `${years}a${months % 12 ? ` ${months % 12}m` : ''}`;
}

export function CompanyProfileView({
  company,
  isOwner,
  canOpenDeal,
  canWatch,
  reputation,
  counterparties,
  dealHistory,
  isAuthenticated,
}: {
  company: CompanyWithRelations;
  isOwner: boolean;
  canOpenDeal: boolean;
  canWatch: boolean;
  reputation: ReputationSignals;
  counterparties: Counterparty[];
  dealHistory: DealHistoryRow[];
  isAuthenticated: boolean;
}) {
  const lat = company.latitude ? Number(company.latitude) : null;
  const lng = company.longitude ? Number(company.longitude) : null;
  const hasLocation = lat !== null && lng !== null;
  const displayName = company.tradeName ?? company.legalName;
  const ratingDisplay =
    reputation.avgRating !== null ? reputation.avgRating.toFixed(1) : '—';

  return (
    <>
      {!isAuthenticated && <PublicNav />}
      <main className="relative">
        {/* HERO */}
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <ProfileNetworkCanvas centerId={company.id} counterparties={counterparties} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-y opacity-50"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(ellipse 90% 60% at 50% 100%, rgba(28,28,28,0) 0%, rgba(28,28,28,0.85) 60%, #1c1c1c 100%)',
            }}
          />

          <div className="mx-auto max-w-layout px-6 pb-16 pt-20 md:pb-24 md:pt-28">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <TechLabel dot className="mb-3">
                  Empresa · {company.slug}
                </TechLabel>
                <h1 className="display-xxl text-[clamp(2rem,5vw,3.6rem)] text-ink-50 max-w-3xl">
                  {displayName}
                </h1>
                {company.tradeName && (
                  <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink-400">
                    {company.legalName}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatusChip kind="verification" value={company.verificationStatus} />
                  {company.city && (
                    <Badge variant="outline">
                      {company.city}
                      {company.state ? ` · ${company.state}` : ''}
                    </Badge>
                  )}
                  {company.serviceRadiusKm && (
                    <Badge variant="muted">Raio {company.serviceRadiusKm} km</Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-2">
                {isOwner && (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/c/edit">Editar</Link>
                  </Button>
                )}
                {canWatch && <WatchButton targetCompanyId={company.id} />}
                {canOpenDeal && (
                  <OpenDealDialog
                    supplierSlug={company.slug}
                    supplierName={displayName}
                    availableModalities={
                      Array.from(new Set(company.offerings.map((o) => o.modality))) as Array<
                        'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'
                      >
                    }
                  />
                )}
              </div>
            </div>

            {/* HUD metrics row */}
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
              <Metric label="Negócios concluídos" value={String(reputation.confirmedDealsCount)} />
              <Metric
                label="Avaliação média"
                value={ratingDisplay}
                suffix={
                  reputation.totalReviews > 0 ? `de ${reputation.totalReviews}` : undefined
                }
              />
              <Metric
                label="Clientes recorrentes"
                value={String(reputation.recurringClientsCount)}
              />
              <Metric label="Tempo na rede" value={timeOnNetwork(company.createdAt)} />
            </dl>
          </div>
        </section>

        {/* §00 Sobre */}
        {company.description && (
          <>
            <ChapterDivider code="§00" title="Sobre" />
            <section className="mx-auto max-w-layout px-6 py-10">
              <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-ink-200">
                {company.description}
              </p>
            </section>
          </>
        )}

        {/* §01 Oferece */}
        <ChapterDivider code="§01" title="Oferece" />
        <section className="mx-auto max-w-layout px-6 py-10">
          {company.offerings.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 px-6 py-12 text-center">
              <TechLabel className="mb-2">Sem ofertas listadas</TechLabel>
              <p className="text-sm text-ink-400">
                Esta empresa atua como compradora na rede.
              </p>
            </div>
          ) : (
            <ul className="grid gap-px overflow-hidden rounded-md border border-white/[0.07] md:grid-cols-2">
              {company.offerings.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-col gap-3 bg-ink-900 p-5 transition-colors hover:bg-ink-850"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="display-md text-base text-ink-50">{o.category}</span>
                      {o.subcategory && (
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-400">
                          {o.subcategory}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {dealTemplateLabels[o.modality]?.['pt-br'] ?? o.modality}
                    </Badge>
                  </div>
                  {o.description && (
                    <p className="text-xs leading-relaxed text-ink-300">{o.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* §02 Histórico */}
        <ChapterDivider code="§02" title="Histórico" />
        <section className="mx-auto max-w-layout px-6 py-10">
          {dealHistory.length === 0 ? (
            <p className="rounded-md border border-dashed border-white/10 px-6 py-8 text-center text-sm text-ink-500">
              Sem negócios públicos concluídos ainda.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-white/[0.07]">
              <table className="w-full text-left font-mono text-[12px]">
                <thead className="border-b border-white/[0.06] bg-ink-900/60 text-[10px] uppercase tracking-wider text-ink-400">
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Contraparte</th>
                    <th className="px-4 py-3">Modalidade</th>
                    <th className="px-4 py-3 text-right">Posição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {dealHistory.map((d) => {
                    const isBuyer = d.buyerCompanyId === company.id;
                    return (
                      <tr key={d.id} className="transition-colors hover:bg-amber/[0.04]">
                        <td className="px-4 py-3 text-ink-300">
                          {formatYearMonth(d.confirmedAt ?? d.closedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/c/${d.counterparty.slug}`}
                            className="text-ink-100 hover:text-amber-glow"
                          >
                            {d.counterparty.tradeName ?? d.counterparty.legalName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ink-300">
                          {dealTemplateLabels[d.template]?.['pt-br'] ?? d.template}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={isBuyer ? 'muted' : 'verified'}>
                            {isBuyer ? 'comprador' : 'fornecedor'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* §03 Reputação */}
        <ChapterDivider code="§03" title="Reputação" />
        <section className="mx-auto max-w-layout px-6 py-10">
          <p className="mb-8 max-w-2xl text-sm text-ink-400">
            Sinais derivados de execução real, não de marketing. Decompostos por princípio,
            sem score único opaco.
          </p>
          {reputation.confirmedDealsCount === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 px-6 py-8 text-center text-sm text-ink-500">
              Reputação será exibida após o primeiro negócio confirmado.
            </div>
          ) : (
            <dl className="grid gap-px overflow-hidden rounded-md border border-white/[0.07] md:grid-cols-3">
              <ReputationRow
                label="Disputas"
                value={
                  reputation.disputedCount === 0
                    ? 'sem disputas'
                    : `${(reputation.disputeRate * 100).toFixed(0)}%`
                }
                tone={reputation.disputeRate > 0.1 ? 'warning' : 'positive'}
              />
              <ReputationRow
                label="Cancelamentos"
                value={String(reputation.cancelledCount)}
                tone="neutral"
              />
              <ReputationRow
                label="Total de avaliações"
                value={String(reputation.totalReviews)}
                tone="neutral"
              />
              {reputation.topCategories.length > 0 && (
                <div className="bg-ink-900 p-5 md:col-span-3">
                  <TechLabel className="mb-3">Categorias com histórico</TechLabel>
                  <div className="flex flex-wrap gap-2">
                    {reputation.topCategories.map((c) => (
                      <Badge key={c.category} variant="muted">
                        {c.category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </dl>
          )}
        </section>

        {/* §04 Localização */}
        {hasLocation && (
          <>
            <ChapterDivider code="§04" title="Localização" />
            <section className="mx-auto max-w-layout px-6 pb-20 pt-10">
              <CompanyMapLazy
                centerLat={lat}
                centerLng={lng}
                radiusKm={company.serviceRadiusKm ?? undefined}
              />
            </section>
          </>
        )}
      </main>
    </>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <TechLabel>{label}</TechLabel>
      <div className="flex items-baseline gap-2">
        <span className="num-marker text-2xl font-medium text-ink-50 md:text-3xl">{value}</span>
        {suffix && (
          <span className="num-marker text-[10px] text-ink-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function ReputationRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'positive' | 'warning' | 'neutral';
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-ink-900 px-5 py-4">
      <TechLabel>{label}</TechLabel>
      <span
        className={
          'num-marker text-sm ' +
          (tone === 'positive'
            ? 'text-amber-glow'
            : tone === 'warning'
              ? 'text-yellow-300'
              : 'text-ink-200')
        }
      >
        {value}
      </span>
    </div>
  );
}
