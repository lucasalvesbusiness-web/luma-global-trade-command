'use client';

import { useMemo, useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type AvailabilityStatus =
  | 'AVAILABLE_NOW'
  | 'PRE_RESERVE_OPEN'
  | 'UNDER_TECHNICAL_VALIDATION'
  | 'LIMITED_AVAILABILITY'
  | 'UNDER_CONSULTATION'
  | 'NOT_AVAILABLE_FOR_DESTINATION';

const STATUS_OPTIONS: AvailabilityStatus[] = [
  'AVAILABLE_NOW',
  'PRE_RESERVE_OPEN',
  'UNDER_TECHNICAL_VALIDATION',
  'LIMITED_AVAILABILITY',
  'UNDER_CONSULTATION',
  'NOT_AVAILABLE_FOR_DESTINATION',
];

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2 py-1 text-[12px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

function toDateInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function AdminAvailabilityClient() {
  const availQ = trpc.admin.listAvailabilities.useQuery();
  const refsQ = trpc.admin.refsForForms.useQuery();

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-light text-luma-ink">
            Disponibilidades
          </h2>
          <p className="text-[12px] text-luma-ink/60">
            Volumes atuais por produto × origem × variedade. Mudanças aparecem
            imediatamente no canvas do comprador.
          </p>
        </div>
      </div>

      <AddAvailabilityForm refs={refsQ.data} />

      {availQ.isLoading && (
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
              <th className="px-3 py-2 text-left font-medium">Faixa (t)</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Válido de</th>
              <th className="px-3 py-2 text-left font-medium">até</th>
              <th className="px-3 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {availQ.data?.map((a) => (
              <AvailabilityRow key={a.id} row={a} />
            ))}
            {availQ.data && availQ.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-luma-ink/50">
                  Sem disponibilidades. Use o formulário acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

type AvailabilityRowData = {
  id: string;
  volumeTonsBand: string;
  status: string;
  validFrom: Date | string;
  validTo: Date | string;
  notes: string | null;
  product: { slug: string; name: string };
  variety: { id: string; name: string } | null;
  origin: { slug: string; name: string };
};

type Refs = {
  products: {
    slug: string;
    name: string;
    varieties: { id: string; name: string }[];
  }[];
  origins: { slug: string; name: string }[];
};

function AvailabilityRow({ row }: { row: AvailabilityRowData }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    volumeTonsBand: row.volumeTonsBand,
    status: row.status as AvailabilityStatus,
    validFrom: toDateInput(row.validFrom),
    validTo: toDateInput(row.validTo),
    notes: row.notes ?? '',
  });

  const updateMut = trpc.admin.updateAvailability.useMutation({
    onSuccess: () => {
      utils.admin.listAvailabilities.invalidate();
      setEditing(false);
    },
  });
  const deleteMut = trpc.admin.deleteAvailability.useMutation({
    onSuccess: () => utils.admin.listAvailabilities.invalidate(),
  });

  if (!editing) {
    return (
      <tr className="hover:bg-luma-sand/20">
        <td className="px-3 py-2 font-medium text-luma-ink">{row.product.name}</td>
        <td className="px-3 py-2 text-luma-ink/70">{row.variety?.name ?? '—'}</td>
        <td className="px-3 py-2 text-luma-ink/70">{row.origin.name}</td>
        <td className="px-3 py-2 tabular-nums">{row.volumeTonsBand}</td>
        <td className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-luma-olive">
          {row.status.replaceAll('_', ' ').toLowerCase()}
        </td>
        <td className="px-3 py-2 tabular-nums text-luma-ink/70">
          {toDateInput(row.validFrom)}
        </td>
        <td className="px-3 py-2 tabular-nums text-luma-ink/70">
          {toDateInput(row.validTo)}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Editar"
              className="rounded-md p-1 text-luma-ink/60 transition hover:bg-luma-sand/60"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Excluir disponibilidade?')) {
                  deleteMut.mutate({ id: row.id });
                }
              }}
              aria-label="Excluir"
              className="rounded-md p-1 text-luma-ink/60 transition hover:bg-luma-earth/10 hover:text-luma-earth"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-luma-olive/5">
      <td className="px-3 py-2 font-medium text-luma-ink">{row.product.name}</td>
      <td className="px-3 py-2 text-luma-ink/70">{row.variety?.name ?? '—'}</td>
      <td className="px-3 py-2 text-luma-ink/70">{row.origin.name}</td>
      <td className="px-3 py-2">
        <input
          className={cn(inputCls, 'w-24')}
          value={form.volumeTonsBand}
          onChange={(e) => setForm((f) => ({ ...f, volumeTonsBand: e.target.value }))}
          placeholder="20–40 t"
        />
      </td>
      <td className="px-3 py-2">
        <select
          className={cn(inputCls, 'w-44')}
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value as AvailabilityStatus }))
          }
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ').toLowerCase()}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="date"
          className={cn(inputCls, 'w-36')}
          value={form.validFrom}
          onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="date"
          className={cn(inputCls, 'w-36')}
          value={form.validTo}
          onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              updateMut.mutate({
                id: row.id,
                volumeTonsBand: form.volumeTonsBand,
                status: form.status,
                validFrom: new Date(form.validFrom),
                validTo: new Date(form.validTo),
                notes: form.notes || null,
              })
            }
            disabled={updateMut.isPending}
            className="rounded-md bg-luma-olive px-2 py-1 text-[11px] text-luma-offwhite hover:brightness-110"
          >
            <Save className="h-3 w-3 inline" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md bg-white px-2 py-1 text-[11px] text-luma-ink/60 ring-1 ring-inset ring-black/5"
          >
            <X className="h-3 w-3 inline" strokeWidth={1.75} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddAvailabilityForm({ refs }: { refs?: Refs }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const today = new Date();
  const ninetyDaysLater = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    productSlug: '',
    varietyId: '',
    originSlug: '',
    volumeTonsBand: '20–40 t',
    status: 'AVAILABLE_NOW' as AvailabilityStatus,
    validFrom: toDateInput(today),
    validTo: toDateInput(ninetyDaysLater),
  });

  const createMut = trpc.admin.createAvailability.useMutation({
    onSuccess: () => {
      utils.admin.listAvailabilities.invalidate();
      setOpen(false);
      setForm({
        productSlug: '',
        varietyId: '',
        originSlug: '',
        volumeTonsBand: '20–40 t',
        status: 'AVAILABLE_NOW',
        validFrom: toDateInput(today),
        validTo: toDateInput(ninetyDaysLater),
      });
    },
  });

  const selectedProduct = useMemo(
    () => refs?.products.find((p) => p.slug === form.productSlug),
    [refs, form.productSlug],
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite shadow-sm hover:brightness-110"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        Nova disponibilidade
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-white/80 p-4 ring-1 ring-inset ring-luma-olive/25 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.6rem] uppercase tracking-[0.26em] text-luma-olive/80">
          Adicionar disponibilidade
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-luma-ink/60 hover:bg-luma-sand/60"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            Produto
          </label>
          <select
            className={inputCls}
            value={form.productSlug}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                productSlug: e.target.value,
                varietyId: '',
              }))
            }
          >
            <option value="">—</option>
            {refs?.products.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            Variedade
          </label>
          <select
            className={inputCls}
            value={form.varietyId}
            onChange={(e) => setForm((f) => ({ ...f, varietyId: e.target.value }))}
            disabled={!selectedProduct}
          >
            <option value="">Qualquer</option>
            {selectedProduct?.varieties.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            Origem
          </label>
          <select
            className={inputCls}
            value={form.originSlug}
            onChange={(e) => setForm((f) => ({ ...f, originSlug: e.target.value }))}
          >
            <option value="">—</option>
            {refs?.origins.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            Faixa (t)
          </label>
          <input
            className={inputCls}
            value={form.volumeTonsBand}
            onChange={(e) =>
              setForm((f) => ({ ...f, volumeTonsBand: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            Status
          </label>
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as AvailabilityStatus }))
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            Válido de
          </label>
          <input
            type="date"
            className={inputCls}
            value={form.validFrom}
            onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-olive/80">
            até
          </label>
          <input
            type="date"
            className={inputCls}
            value={form.validTo}
            onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            createMut.mutate({
              productSlug: form.productSlug,
              varietyId: form.varietyId || null,
              originSlug: form.originSlug,
              volumeTonsBand: form.volumeTonsBand,
              status: form.status,
              validFrom: new Date(form.validFrom),
              validTo: new Date(form.validTo),
              notes: null,
            })
          }
          disabled={
            createMut.isPending ||
            !form.productSlug ||
            !form.originSlug ||
            !form.volumeTonsBand
          }
          className="inline-flex items-center gap-1 rounded-md bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite hover:brightness-110 disabled:opacity-60"
        >
          <Plus className="h-3 w-3" strokeWidth={1.75} />
          Criar
        </button>
        {createMut.error && (
          <p className="text-[11px] text-[hsl(var(--luma-earth))]">
            {createMut.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
