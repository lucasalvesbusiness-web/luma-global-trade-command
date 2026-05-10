import Link from 'next/link';

import type { CompanyWithRelations } from '@/server/repositories/interfaces';
import type { ReputationSignals } from '@/server/services/reputation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { CompanyMapLazy } from '@/components/canvas/CompanyMapLazy';
import { OpenDealDialog } from '@/components/deal/OpenDealDialog';
import { ReputationBadge } from '@/components/company/ReputationBadge';
import { dealTemplateLabels } from '@/lib/status/enums';

export function CompanyProfileView({
  company,
  isOwner,
  canOpenDeal,
  reputation,
}: {
  company: CompanyWithRelations;
  isOwner: boolean;
  canOpenDeal: boolean;
  reputation: ReputationSignals;
}) {
  const lat = company.latitude ? Number(company.latitude) : null;
  const lng = company.longitude ? Number(company.longitude) : null;
  const hasLocation = lat !== null && lng !== null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-400">Empresa</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">
            {company.tradeName ?? company.legalName}
          </h1>
          {company.tradeName && (
            <p className="mt-1 text-sm text-ink-300">{company.legalName}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
        {isOwner && (
          <Button variant="outline" asChild>
            <Link href="/c/edit">Editar</Link>
          </Button>
        )}
      </div>

      {canOpenDeal && (
        <div className="mb-6">
          <OpenDealDialog
            supplierSlug={company.slug}
            supplierName={company.tradeName ?? company.legalName}
            availableModalities={
              Array.from(new Set(company.offerings.map((o) => o.modality))) as Array<
                'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'
              >
            }
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {company.description && (
            <Card>
              <CardHeader>
                <CardTitle>Sobre</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-100">
                  {company.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Categorias atendidas</CardTitle>
            </CardHeader>
            <CardContent>
              {company.offerings.length === 0 ? (
                <p className="text-sm text-ink-400">Sem categorias cadastradas.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {company.offerings.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2"
                    >
                      <span className="text-sm">{o.category}</span>
                      <Badge variant="outline">
                        {dealTemplateLabels[o.modality]?.['pt-br'] ?? o.modality}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <ReputationBadge signals={reputation} />
          <Card>
            <CardHeader>
              <CardTitle>Localização e cobertura</CardTitle>
            </CardHeader>
            <CardContent>
              {hasLocation ? (
                <CompanyMapLazy
                  centerLat={lat}
                  centerLng={lng}
                  radiusKm={company.serviceRadiusKm ?? undefined}
                />
              ) : (
                <p className="text-sm text-ink-400">Sem localização cadastrada.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
