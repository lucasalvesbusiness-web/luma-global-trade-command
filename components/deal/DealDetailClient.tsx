'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { AuditEvent, DealRoomStatus } from '@prisma/client';
import type { DealRoomWithRelations } from '@/server/repositories/prisma/deal-room';
import { allowedNextStates, findTransition } from '@/server/services/deal-room-transitions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { StatusChip } from '@/components/ui/StatusChip';
import { dealRoomStatusLabels, dealTemplateLabels } from '@/lib/status/enums';
import { trpc } from '@/lib/trpc/react';

type Role = 'BUYER' | 'SUPPLIER';

const STATUS_LABELS_PT = Object.fromEntries(
  Object.entries(dealRoomStatusLabels).map(([k, v]) => [k, v['pt-br']]),
) as Record<DealRoomStatus, string>;

export function DealDetailClient({
  deal,
  viewerRole,
  events,
}: {
  deal: DealRoomWithRelations;
  viewerRole: Role;
  events: AuditEvent[];
}) {
  const router = useRouter();
  const transition = trpc.dealRoom.transition.useMutation();
  const attach = trpc.dealRoom.attachEvidence.useMutation();
  const accept = trpc.dealRoom.acceptEvidence.useMutation();
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const counterparty = viewerRole === 'BUYER' ? deal.supplierCompany : deal.buyerCompany;
  const nextStates = allowedNextStates(deal.status).filter((to) => {
    const t = findTransition(deal.status, to);
    return t && (t.actor === 'EITHER' || t.actor === viewerRole);
  });

  async function fireTransition(to: DealRoomStatus, extra?: { quoteCents?: number }) {
    setError(null);
    try {
      await transition.mutateAsync({ id: deal.id, to, patch: extra });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function uploadEvidence() {
    if (!evidenceUrl) return;
    setError(null);
    try {
      await attach.mutateAsync({
        dealRoomId: deal.id,
        kind: 'PHOTO',
        url: evidenceUrl,
        caption: evidenceCaption || undefined,
      });
      setEvidenceUrl('');
      setEvidenceCaption('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  async function acceptEvidenceById(id: string) {
    setError(null);
    try {
      await accept.mutateAsync({ dealRoomId: deal.id, evidenceId: id });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/deals" className="text-xs text-luma-ink/60 hover:underline">
        ← Voltar aos deal rooms
      </Link>

      <header className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-luma-ink/50">
            {viewerRole === 'BUYER' ? 'Comprador' : 'Fornecedor'} ·{' '}
            {dealTemplateLabels[deal.template]?.['pt-br']}
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">{deal.title}</h1>
          <p className="mt-1 text-sm text-luma-ink/60">
            {viewerRole === 'BUYER' ? 'Fornecedor: ' : 'Comprador: '}
            <Link className="underline" href={`/company/${counterparty.slug}`}>
              {counterparty.tradeName ?? counterparty.legalName}
            </Link>
          </p>
        </div>
        <StatusChip kind="dealRoom" value={deal.status} />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Escopo</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap rounded-md bg-luma-sand/30 p-4 text-xs text-luma-ink/80">
                {deal.scopePayload ? JSON.stringify(deal.scopePayload, null, 2) : '— sem escopo —'}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidências ({deal.evidences.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {deal.evidences.length === 0 && (
                <p className="text-sm text-luma-ink/50">Sem evidências ainda.</p>
              )}
              {deal.evidences.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-luma-ink/10 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium underline"
                    >
                      {ev.kind} · {ev.url}
                    </a>
                    {ev.caption && (
                      <p className="mt-1 text-xs text-luma-ink/60">{ev.caption}</p>
                    )}
                  </div>
                  {ev.acceptedAt ? (
                    <Badge variant="verified">aceito</Badge>
                  ) : ev.uploadedById !== /* viewerUserId */ '' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acceptEvidenceById(ev.id)}
                      disabled={accept.isPending}
                    >
                      Aceitar
                    </Button>
                  )}
                </div>
              ))}

              <div className="rounded-md border border-dashed border-luma-ink/15 p-3">
                <p className="mb-2 text-xs text-luma-ink/60">
                  Cole uma URL pública (no MVP). Em F3.5 ligamos upload via Vercel Blob.
                </p>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="https://… (foto, doc, etc)"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                  <Input
                    placeholder="legenda (opcional)"
                    value={evidenceCaption}
                    onChange={(e) => setEvidenceCaption(e.target.value)}
                  />
                  <Button onClick={uploadEvidence} disabled={attach.isPending || !evidenceUrl}>
                    Anexar evidência
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-luma-ink/50">Sem eventos.</p>
              ) : (
                <ol className="flex flex-col gap-2 text-sm">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-luma-olive" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {e.action}
                          {e.fromStatus && e.toStatus && (
                            <span className="ml-2 text-xs text-luma-ink/50">
                              {STATUS_LABELS_PT[e.fromStatus as DealRoomStatus] ?? e.fromStatus} →{' '}
                              {STATUS_LABELS_PT[e.toStatus as DealRoomStatus] ?? e.toStatus}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-luma-ink/50">
                          {new Date(e.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Ações disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {nextStates.length === 0 && (
                <p className="text-sm text-luma-ink/50">Nenhuma ação para você neste estado.</p>
              )}

              {nextStates.includes('QUOTED') && viewerRole === 'SUPPLIER' && (
                <div className="flex flex-col gap-2 rounded-md border border-luma-ink/10 p-3">
                  <Label>Cotação (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!quoteAmount || transition.isPending}
                    onClick={() =>
                      fireTransition('QUOTED', {
                        quoteCents: Math.round(Number(quoteAmount) * 100),
                      })
                    }
                  >
                    Enviar cotação
                  </Button>
                </div>
              )}

              {nextStates
                .filter((s) => !(s === 'QUOTED' && viewerRole === 'SUPPLIER'))
                .map((to) => (
                  <Button
                    key={to}
                    variant={to === 'CANCELLED' || to === 'DISPUTED' ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => fireTransition(to)}
                    disabled={transition.isPending}
                  >
                    {STATUS_LABELS_PT[to] ?? to}
                  </Button>
                ))}

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>

          {deal.quoteCents !== null && deal.quoteCents !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Cotação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-2xl">
                  {(deal.quoteCents / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: deal.quoteCurrency ?? 'BRL',
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
