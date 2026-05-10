'use client';

import Link from 'next/link';

import type { DealRoomWithRelations } from '@/server/repositories/prisma/deal-room';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/StatusChip';
import { dealTemplateLabels } from '@/lib/status/enums';

type DealRow = DealRoomWithRelations & { viewerRole: 'BUYER' | 'SUPPLIER' };

export function DealListClient({
  deals,
  pendingReviewsCount,
}: {
  deals: DealRow[];
  pendingReviewsCount: number;
}) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-luma-ink/50">Deal rooms</p>
        <h1 className="font-display text-2xl">Seus negócios</h1>
      </header>

      {pendingReviewsCount > 0 && (
        <Link
          href="/reviews/pending"
          className="mb-4 block rounded-lg border border-luma-olive/40 bg-luma-olive/10 px-4 py-3 text-sm transition-colors hover:bg-luma-olive/15"
        >
          <span className="font-medium">{pendingReviewsCount}</span> avaliação(ões) pendente(s) →
        </Link>
      )}

      {deals.length === 0 ? (
        <p className="rounded-lg border border-dashed border-luma-ink/15 p-8 text-center text-sm text-luma-ink/60">
          Nenhum deal aberto. Use a busca para encontrar fornecedores e abrir um deal.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {deals.map((d) => {
            const counterparty = d.viewerRole === 'BUYER' ? d.supplierCompany : d.buyerCompany;
            return (
              <li key={d.id}>
                <Link href={`/deals/${d.id}`} className="block">
                  <Card className="transition-colors hover:border-luma-ink/30">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{d.title}</CardTitle>
                          <p className="mt-1 text-xs text-luma-ink/60">
                            {d.viewerRole === 'BUYER' ? 'Fornecedor: ' : 'Comprador: '}
                            <span className="font-medium text-luma-ink/80">
                              {counterparty.tradeName ?? counterparty.legalName}
                            </span>
                          </p>
                        </div>
                        <StatusChip kind="dealRoom" value={d.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {dealTemplateLabels[d.template]?.['pt-br'] ?? d.template}
                      </Badge>
                      <Badge variant="muted">
                        {d.viewerRole === 'BUYER' ? 'você é comprador' : 'você é fornecedor'}
                      </Badge>
                      {d.quoteCents !== null && d.quoteCents !== undefined && (
                        <Badge variant="default">
                          {(d.quoteCents / 100).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: d.quoteCurrency ?? 'BRL',
                          })}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
