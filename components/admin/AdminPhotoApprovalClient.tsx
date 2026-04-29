'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, RotateCcw, Trash2 } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

export function AdminPhotoApprovalClient() {
  const [pendingOnly, setPendingOnly] = useState(true);
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listFieldPhotos.useQuery({ pendingOnly });
  const approve = trpc.admin.approveFieldPhoto.useMutation({
    onSuccess: () => utils.admin.listFieldPhotos.invalidate(),
  });
  const unapprove = trpc.admin.unapproveFieldPhoto.useMutation({
    onSuccess: () => utils.admin.listFieldPhotos.invalidate(),
  });
  const remove = trpc.admin.deleteFieldPhoto.useMutation({
    onSuccess: () => utils.admin.listFieldPhotos.invalidate(),
  });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-light text-luma-ink">
            Aprovação de fotos
          </h2>
          <p className="text-[12px] text-luma-ink/60">
            Apenas fotos aprovadas aparecem para o comprador no Field View.
            Inspecione antes de aprovar — pessoas identificáveis ou áreas
            sensíveis devem ser rejeitadas.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPendingOnly(true)}
            className={cn(
              'rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 ring-inset transition',
              pendingOnly
                ? 'bg-luma-olive text-luma-offwhite ring-luma-olive'
                : 'bg-white/60 text-luma-ink/70 ring-black/5 hover:bg-white',
            )}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setPendingOnly(false)}
            className={cn(
              'rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 ring-inset transition',
              !pendingOnly
                ? 'bg-luma-olive text-luma-offwhite ring-luma-olive'
                : 'bg-white/60 text-luma-ink/70 ring-black/5 hover:bg-white',
            )}
          >
            Todas
          </button>
        </div>
      </div>

      {listQ.isLoading && (
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      )}

      {!listQ.isLoading && (listQ.data?.length ?? 0) === 0 && (
        <p className="rounded-xl bg-white/70 px-5 py-12 text-center text-[12.5px] text-luma-ink/55 ring-1 ring-inset ring-black/5">
          {pendingOnly
            ? 'Nenhuma foto aguardando aprovação.'
            : 'Nenhuma foto cadastrada.'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listQ.data?.map((p) => {
          const approved = p.approvedForBuyerView;
          return (
            <article
              key={p.id}
              className="overflow-hidden rounded-xl bg-white/80 ring-1 ring-inset ring-black/5"
            >
              <div className="relative aspect-[4/3] bg-luma-sand/40">
                {/* storagePath assumed to be public path like /media/photos/x.jpg */}
                {p.storagePath ? (
                  <Image
                    src={p.storagePath}
                    alt={p.caption ?? ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[11px] text-luma-ink/40">
                    sem imagem
                  </div>
                )}
                <span
                  className={cn(
                    'absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]',
                    approved
                      ? 'bg-luma-field/90 text-luma-offwhite'
                      : 'bg-luma-sun/90 text-luma-ink',
                  )}
                >
                  {approved ? 'aprovada' : 'pendente'}
                </span>
              </div>
              <div className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-luma-olive/85">
                    {p.fieldUpdate.origin.name}
                  </p>
                  <p className="text-[10.5px] text-luma-ink/55">
                    {new Date(p.fieldUpdate.observedAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-[12.5px] text-luma-ink/85 min-h-[2.4em]">
                  {p.caption ?? <span className="text-luma-ink/40">sem legenda</span>}
                </p>
                <p className="text-[10.5px] text-luma-ink/55">
                  Estágio: {p.fieldUpdate.stage.toLowerCase().replaceAll('_', ' ')}
                </p>
                {approved && p.approvedBy && (
                  <p className="text-[10.5px] text-luma-ink/55">
                    Aprovada por {p.approvedBy.name ?? p.approvedBy.email}
                    {p.approvedAt
                      ? ` em ${new Date(p.approvedAt).toLocaleDateString()}`
                      : ''}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {approved ? (
                    <button
                      type="button"
                      disabled={unapprove.isPending}
                      onClick={() => unapprove.mutate({ id: p.id })}
                      className="inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-[11px] text-luma-ink/70 ring-1 ring-inset ring-black/5 hover:bg-white"
                    >
                      <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                      Despublicar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate({ id: p.id })}
                      className="inline-flex items-center gap-1 rounded-full bg-luma-olive px-3 py-1 text-[11px] font-medium text-luma-offwhite hover:bg-luma-olive/90 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" strokeWidth={1.5} />
                      Aprovar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Remover foto permanentemente?')) {
                        remove.mutate({ id: p.id });
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-[11px] text-red-700 ring-1 ring-inset ring-black/5 hover:bg-white"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
