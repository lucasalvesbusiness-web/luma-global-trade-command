'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';

type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';

const CONFIDENCE_OPTIONS: Confidence[] = ['LOW', 'MEDIUM', 'HIGH'];

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2 py-1 text-[12px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

function toDateInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function AdminHarvestWindowsClient() {
  const listQ = trpc.admin.listHarvestWindows.useQuery();
  const refsQ = trpc.admin.refsForForms.useQuery();

  return (
    <main className="p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-light text-luma-ink">
          Janelas de colheita
        </h2>
        <p className="text-[12px] text-luma-ink/60">
          Períodos previstos de colheita por produto × variedade × origem.
          Alimenta o Field View e o passaporte do produto.
        </p>
      </div>

      <AddForm refs={refsQ.data} />

      {listQ.isLoading && (
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-white/70 ring-1 ring-inset ring-black/5">
        <table className="min-w-full text-[12px]">
          <thead className="bg-luma-sand/50 text-[10px] uppercase tracking-[0.16em] text-luma-ink/60">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Produto</th>
              <th className="px-3 py-2 text-left font-medium">Variedade</th>
              <th className="px-3 py-2 text-left font-medium">Origem</th>
              <th className="px-3 py-2 text-left font-medium">Início</th>
              <th className="px-3 py-2 text-left font-medium">Fim</th>
              <th className="px-3 py-2 text-left font-medium">Confiança</th>
              <th className="px-3 py-2 text-left font-medium">Notas</th>
              <th className="px-3 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {listQ.data?.map((row) => <Row key={row.id} row={row} />)}
            {!listQ.isLoading && (listQ.data?.length ?? 0) === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-[12px] text-luma-ink/45"
                >
                  Sem janelas de colheita cadastradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

type RefsData = {
  products: {
    slug: string;
    name: string;
    varieties: { id: string; name: string }[];
  }[];
  origins: { slug: string; name: string }[];
  countries: { iso2: string; name: string }[];
};

function AddForm({ refs }: { refs: RefsData | undefined }) {
  const utils = trpc.useUtils();
  const create = trpc.admin.createHarvestWindow.useMutation({
    onSuccess: () => utils.admin.listHarvestWindows.invalidate(),
  });
  const [open, setOpen] = useState(false);
  const [productSlug, setProductSlug] = useState('');
  const [varietyId, setVarietyId] = useState<string>('');
  const [originSlug, setOriginSlug] = useState('');
  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(new Date()));
  const [confidence, setConfidence] = useState<Confidence>('MEDIUM');
  const [notes, setNotes] = useState('');

  const varietiesForProduct = useMemo(
    () => refs?.products.find((p) => p.slug === productSlug)?.varieties ?? [],
    [refs, productSlug],
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite hover:bg-luma-olive/90"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        Nova janela de colheita
      </button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productSlug || !originSlug) return;
    create.mutate(
      {
        productSlug,
        varietyId: varietyId || null,
        originSlug,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        confidence,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setProductSlug('');
          setVarietyId('');
          setOriginSlug('');
          setNotes('');
        },
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white/80 p-4 ring-1 ring-inset ring-black/5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        <label className="md:col-span-2 text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Produto
          <select
            value={productSlug}
            onChange={(e) => {
              setProductSlug(e.target.value);
              setVarietyId('');
            }}
            className={`${inputCls} mt-1`}
          >
            <option value="">—</option>
            {refs?.products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Variedade
          <select
            value={varietyId}
            onChange={(e) => setVarietyId(e.target.value)}
            className={`${inputCls} mt-1`}
            disabled={varietiesForProduct.length === 0}
          >
            <option value="">— todas —</option>
            {varietiesForProduct.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2 text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Origem
          <select
            value={originSlug}
            onChange={(e) => setOriginSlug(e.target.value)}
            className={`${inputCls} mt-1`}
          >
            <option value="">—</option>
            {refs?.origins.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Início
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Fim
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`${inputCls} mt-1`}
          />
        </label>
        <label className="md:col-span-2 text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Confiança
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as Confidence)}
            className={`${inputCls} mt-1`}
          >
            {CONFIDENCE_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-5 text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
          Notas
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`${inputCls} mt-1`}
            maxLength={500}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full bg-white/60 px-3 py-1.5 text-[12px] text-luma-ink/70 hover:bg-white"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={create.isPending || !productSlug || !originSlug}
          className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite hover:bg-luma-olive/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
          Salvar
        </button>
      </div>
      {create.error && (
        <p className="mt-2 text-[11px] text-red-700">{create.error.message}</p>
      )}
    </form>
  );
}

type HarvestWindowRow = {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string | null;
  product: { slug: string; name: string };
  variety: { id: string; name: string } | null;
  origin: { slug: string; name: string };
};

function Row({ row }: { row: HarvestWindowRow }) {
  const utils = trpc.useUtils();
  const update = trpc.admin.updateHarvestWindow.useMutation({
    onSuccess: () => utils.admin.listHarvestWindows.invalidate(),
  });
  const remove = trpc.admin.deleteHarvestWindow.useMutation({
    onSuccess: () => utils.admin.listHarvestWindows.invalidate(),
  });

  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(toDateInput(row.startDate));
  const [endDate, setEndDate] = useState(toDateInput(row.endDate));
  const [confidence, setConfidence] = useState<Confidence>(row.confidence);
  const [notes, setNotes] = useState(row.notes ?? '');

  if (!editing) {
    return (
      <tr className="hover:bg-luma-sand/15">
        <td className="px-3 py-2 text-luma-ink/85">{row.product.name}</td>
        <td className="px-3 py-2 text-luma-ink/70">{row.variety?.name ?? '—'}</td>
        <td className="px-3 py-2 text-luma-ink/85">{row.origin.name}</td>
        <td className="px-3 py-2 tabular-nums text-luma-ink/85">
          {toDateInput(row.startDate)}
        </td>
        <td className="px-3 py-2 tabular-nums text-luma-ink/85">
          {toDateInput(row.endDate)}
        </td>
        <td className="px-3 py-2 text-luma-ink/70">{row.confidence}</td>
        <td className="px-3 py-2 text-luma-ink/60 max-w-[260px] truncate">
          {row.notes ?? ''}
        </td>
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] text-luma-ink/70 hover:bg-white"
          >
            <Pencil className="h-3 w-3" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Remover esta janela?')) remove.mutate({ id: row.id });
            }}
            className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] text-red-700 hover:bg-white"
          >
            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-luma-sand/20">
      <td className="px-3 py-2 text-luma-ink/85">{row.product.name}</td>
      <td className="px-3 py-2 text-luma-ink/70">{row.variety?.name ?? '—'}</td>
      <td className="px-3 py-2 text-luma-ink/85">{row.origin.name}</td>
      <td className="px-3 py-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputCls}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={inputCls}
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value as Confidence)}
          className={inputCls}
        >
          {CONFIDENCE_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputCls}
          maxLength={500}
        />
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button
          type="button"
          disabled={update.isPending}
          onClick={() => {
            update.mutate(
              {
                id: row.id,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                confidence,
                notes: notes || null,
              },
              { onSuccess: () => setEditing(false) },
            );
          }}
          className="inline-flex items-center gap-1 rounded-full bg-luma-olive px-2 py-1 text-[11px] text-luma-offwhite hover:bg-luma-olive/90 disabled:opacity-50"
        >
          <Save className="h-3 w-3" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-1 text-[11px] text-luma-ink/70 hover:bg-white"
        >
          <X className="h-3 w-3" strokeWidth={1.5} />
        </button>
      </td>
    </tr>
  );
}
