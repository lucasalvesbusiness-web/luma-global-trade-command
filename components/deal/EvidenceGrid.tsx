'use client';

import { useState } from 'react';
import type { Evidence } from '@prisma/client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

function isImage(url: string) {
  return /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url) || url.includes('images.unsplash.com');
}

const KIND_LABELS: Record<string, string> = {
  PHOTO: 'foto',
  DOC: 'doc',
  SIGNATURE: 'assin.',
  INVOICE_PREVIEW: 'fatura',
};

export function EvidenceGrid({
  dealRoomId,
  evidences,
  onChanged,
}: {
  dealRoomId: string;
  evidences: Evidence[];
  onChanged: () => void;
}) {
  const attach = trpc.dealRoom.attachEvidence.useMutation();
  const accept = trpc.dealRoom.acceptEvidence.useMutation();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [kind, setKind] = useState<'PHOTO' | 'DOC' | 'SIGNATURE' | 'INVOICE_PREVIEW'>(
    'PHOTO',
  );

  async function upload() {
    if (!url) return;
    await attach.mutateAsync({ dealRoomId, kind, url, caption: caption || undefined });
    setUrl('');
    setCaption('');
    onChanged();
  }

  async function acceptOne(id: string) {
    await accept.mutateAsync({ dealRoomId, evidenceId: id });
    onChanged();
  }

  return (
    <div className="flex flex-col gap-5">
      {evidences.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 px-6 py-8 text-center text-xs text-ink-500">
          Sem evidências ainda. Suba a primeira abaixo.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {evidences.map((ev) => (
            <li
              key={ev.id}
              className="group relative overflow-hidden rounded-md border border-white/[0.07] bg-ink-850/60 transition-colors hover:border-amber/30"
            >
              <div className="relative aspect-video bg-ink-900">
                {isImage(ev.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.url}
                    alt={ev.caption ?? 'Evidência'}
                    className="h-full w-full object-cover transition-transform duration-700 ease-cinematic group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-500">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.2}
                      className="h-10 w-10"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                )}
                <span
                  className={cn(
                    'absolute left-2 top-2 rounded-sm border border-white/15 bg-ink-900/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider backdrop-blur',
                    ev.acceptedAt ? 'text-amber-glow' : 'text-ink-300',
                  )}
                >
                  {KIND_LABELS[ev.kind] ?? ev.kind}
                </span>
                {ev.acceptedAt && (
                  <span className="absolute right-2 top-2 rounded-sm border border-amber/40 bg-amber/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-glow backdrop-blur">
                    aceito
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] text-ink-200 hover:text-amber-glow"
                  >
                    {ev.caption || ev.url}
                  </a>
                  <span className="num-marker text-[9px] text-ink-500">
                    {new Date(ev.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {!ev.acceptedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acceptOne(ev.id)}
                    disabled={accept.isPending}
                  >
                    Aceitar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-white/10 p-4">
        <TechLabel className="mb-3">Anexar evidência</TechLabel>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-[140px_1fr]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-kind">Tipo</Label>
              <select
                id="ev-kind"
                className="h-10 rounded-md border border-white/10 bg-ink-800 px-2 text-xs text-ink-100 focus:border-amber/60 focus:outline-none"
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                <option value="PHOTO">Foto</option>
                <option value="DOC">Documento</option>
                <option value="SIGNATURE">Assinatura</option>
                <option value="INVOICE_PREVIEW">Fatura (preview)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-url">URL</Label>
              <Input
                id="ev-url"
                placeholder="https://… (foto, PDF, etc.)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-caption">Legenda (opcional)</Label>
            <Input
              id="ev-caption"
              maxLength={200}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
          <Button onClick={upload} disabled={!url || attach.isPending} size="sm">
            {attach.isPending ? 'Enviando…' : 'Anexar →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
