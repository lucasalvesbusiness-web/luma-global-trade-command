'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  Send,
  Trash2,
  X,
} from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type StagedPhoto = {
  localId: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  caption: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string;
};

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

export function FieldPlotSubmitClient({
  slug,
  plotId,
}: {
  slug: string;
  plotId: string;
}) {
  const utils = trpc.useUtils();
  const plotQ = trpc.field.plotHistory.useQuery({ plotId });
  const submitM = trpc.field.createSubmission.useMutation({
    onSuccess: () => {
      utils.field.myOrigin.invalidate();
      utils.field.plotHistory.invalidate({ plotId });
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  if (plotQ.isLoading) {
    return (
      <main className="p-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      </main>
    );
  }
  if (plotQ.error || !plotQ.data) {
    return (
      <main className="p-6">
        <p className="text-[12px] text-red-700">
          {plotQ.error?.message ?? 'Talhão não encontrado.'}
        </p>
      </main>
    );
  }

  const plot = plotQ.data;
  const minRequired = plot.routine?.minPhotosPerCycle ?? 1;
  const uploadedCount = photos.filter((p) => p.status === 'uploaded').length;
  const canSubmit =
    uploadedCount >= minRequired &&
    photos.every((p) => p.status === 'uploaded') &&
    !submitM.isPending;

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const next: StagedPhoto[] = list.map((f) => ({
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      caption: '',
      status: 'pending',
    }));
    setPhotos((cur) => [...cur, ...next]);
    next.forEach((p) => uploadOne(p.localId, p.file));
  }

  async function uploadOne(localId: string, file: File) {
    setPhotos((cur) =>
      cur.map((p) => (p.localId === localId ? { ...p, status: 'uploading' } : p)),
    );
    try {
      // Client-side compression: campo opera em 3G/4G fraco. Reduz para ≤1.5MB
      // a 2048px no eixo maior. Mantém EXIF orientation. Falhas de compressão
      // (browsers antigos, formatos incomuns) caem no upload do file original.
      let toUpload: File | Blob = file;
      if (file.type.startsWith('image/') && file.size > 800 * 1024) {
        try {
          const { default: imageCompression } = await import(
            'browser-image-compression'
          );
          const compressed = await imageCompression(file, {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 2048,
            useWebWorker: true,
            fileType: file.type === 'image/png' ? 'image/jpeg' : file.type,
            initialQuality: 0.82,
          });
          if (compressed.size < file.size) toUpload = compressed;
        } catch (err) {
          console.warn('[field] compression skipped:', err);
        }
      }

      const fd = new FormData();
      fd.append(
        'file',
        toUpload,
        toUpload instanceof File ? toUpload.name : file.name,
      );
      const res = await fetch(`/api/field/upload?plotId=${plotId}`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'upload failed' }));
        throw new Error(err.error ?? 'upload failed');
      }
      const data = (await res.json()) as { url: string };
      setPhotos((cur) =>
        cur.map((p) =>
          p.localId === localId
            ? { ...p, status: 'uploaded', uploadedUrl: data.url }
            : p,
        ),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'falha';
      setPhotos((cur) =>
        cur.map((p) =>
          p.localId === localId ? { ...p, status: 'failed', error: msg } : p,
        ),
      );
    }
  }

  function removePhoto(localId: string) {
    setPhotos((cur) => {
      const target = cur.find((p) => p.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return cur.filter((p) => p.localId !== localId);
    });
  }

  async function handleSubmit() {
    const uploaded = photos.filter((p) => p.status === 'uploaded' && p.uploadedUrl);
    submitM.mutate(
      {
        plotId,
        notes: notes.trim() || undefined,
        photos: uploaded.map((p) => ({
          url: p.uploadedUrl!,
          caption: p.caption.trim() || undefined,
        })),
      },
      {
        onSuccess: () => {
          photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          setPhotos([]);
          setNotes('');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 4000);
        },
      },
    );
  }

  return (
    <main className="space-y-5 p-6">
      <div>
        <Link
          href={`/field/${slug}`}
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-luma-ink/60 hover:text-luma-ink"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> Voltar
        </Link>
        <h2 className="mt-1 font-display text-2xl font-light text-luma-ink">
          {plot.name}
        </h2>
        <p className="text-[12px] text-luma-ink/60">
          {plot.crop}
          {plot.routine
            ? ` · cadência ${plot.routine.cadenceDays}d · mín. ${plot.routine.minPhotosPerCycle} fotos`
            : ''}
        </p>
        {plot.routine?.instructions && (
          <p className="mt-2 rounded-md bg-luma-sun/15 p-2.5 text-[12px] italic text-luma-ink/80">
            {plot.routine.instructions}
          </p>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-luma-field/10 p-3 text-[13px] text-luma-field">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
          Submissão registrada. Obrigado!
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-display text-base font-medium text-luma-ink">
          Nova submissão
        </h3>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
          className="rounded-xl border-2 border-dashed border-luma-olive/30 bg-white/50 p-6 text-center"
        >
          <ImagePlus
            className="mx-auto h-6 w-6 text-luma-olive/70"
            strokeWidth={1.5}
          />
          <p className="mt-2 text-[12.5px] text-luma-ink/70">
            Arraste fotos aqui ou
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            <Camera className="h-3.5 w-3.5" strokeWidth={1.5} />
            Escolher arquivos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <p className="mt-2 text-[10.5px] text-luma-ink/55">
            JPEG, PNG ou WebP até 10 MB cada
          </p>
        </div>

        {photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((p) => (
              <li
                key={p.localId}
                className="overflow-hidden rounded-lg bg-white/80 ring-1 ring-inset ring-black/5"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {p.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-[11px] uppercase tracking-[0.2em] text-white">
                      Enviando…
                    </div>
                  )}
                  {p.status === 'failed' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-700/80 p-2 text-center text-[11px] text-white">
                      <X className="h-4 w-4" strokeWidth={1.5} />
                      <span>{p.error}</span>
                    </div>
                  )}
                  {p.status === 'uploaded' && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-luma-field/90 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white">
                      ✓ ok
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(p.localId)}
                    aria-label="Remover"
                    className="absolute left-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
                <input
                  value={p.caption}
                  onChange={(e) =>
                    setPhotos((cur) =>
                      cur.map((x) =>
                        x.localId === p.localId
                          ? { ...x, caption: e.target.value }
                          : x,
                      ),
                    )
                  }
                  placeholder="Legenda (opcional)"
                  className={cn(inputCls, 'rounded-none border-x-0 border-b-0 text-[11.5px]')}
                />
              </li>
            ))}
          </ul>
        )}

        <div>
          <label className="text-[0.58rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium">
            Notas (opcional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre o estado do talhão"
            className={cn(inputCls, 'mt-1')}
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11.5px] text-luma-ink/60">
            {uploadedCount}/{minRequired} fotos enviadas
            {uploadedCount < minRequired && ' (mínimo)'}
          </p>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-4 py-2 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            {submitM.isPending ? 'Registrando…' : 'Registrar submissão'}
          </button>
        </div>
        {submitM.error && (
          <p className="text-[12px] text-red-700">{submitM.error.message}</p>
        )}
      </section>

      {/* Histórico */}
      <section>
        <h3 className="mb-2 font-display text-base font-medium text-luma-ink">
          Submissões recentes
        </h3>
        <ul className="space-y-2">
          {plot.submissions.length === 0 && (
            <li className="rounded-xl bg-white/50 p-4 text-center text-[12px] text-luma-ink/60">
              Sem submissões ainda.
            </li>
          )}
          {plot.submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl bg-white/70 p-3 ring-1 ring-inset ring-black/5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] text-luma-ink">
                  {new Date(s.submittedAt).toLocaleString()}
                </p>
                <p className="text-[10.5px] uppercase tracking-[0.2em] text-luma-olive/85">
                  {s.photos.length} fotos
                </p>
              </div>
              {s.notes && (
                <p className="mt-1 text-[11.5px] italic text-luma-ink/65">
                  {s.notes}
                </p>
              )}
              {s.photos.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-1.5 md:grid-cols-6">
                  {s.photos.map((ph) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={ph.id}
                      src={ph.storagePath}
                      alt={ph.caption ?? ''}
                      className="aspect-square w-full rounded object-cover"
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
