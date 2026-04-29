'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type RecommendedContainerKind =
  | 'REEFER_20'
  | 'REEFER_40'
  | 'REEFER_40_HC'
  | 'DRY_20'
  | 'DRY_40';

const CONTAINER_OPTIONS: RecommendedContainerKind[] = [
  'REEFER_20',
  'REEFER_40',
  'REEFER_40_HC',
  'DRY_20',
  'DRY_40',
];

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';
const labelCls =
  'text-[0.58rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium';

export function AdminProductsClient() {
  const productsQ = trpc.admin.listProducts.useQuery();
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  return (
    <main className="p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-light text-luma-ink">Produtos</h2>
        <p className="text-[12px] text-luma-ink/60">
          Gestão de produto, variedades e dados técnicos. Mudanças aparecem no
          canvas do comprador imediatamente.
        </p>
      </div>

      {productsQ.isLoading && (
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      )}

      <ul className="space-y-2">
        {productsQ.data?.map((p) => (
          <li
            key={p.id}
            className="rounded-xl bg-white/70 ring-1 ring-inset ring-black/5"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedSlug((cur) => (cur === p.slug ? null : p.slug))
              }
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-medium text-luma-ink">
                  {p.name}
                </p>
                <p className="text-[11px] text-luma-ink/60">
                  {p.category.name} · {p.varieties.length} variedades ·{' '}
                  {p.recommendedContainerKind.replaceAll('_', ' ')}
                </p>
              </div>
              {expandedSlug === p.slug ? (
                <ChevronDown className="h-4 w-4 text-luma-ink/50" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="h-4 w-4 text-luma-ink/50" strokeWidth={1.5} />
              )}
            </button>
            {expandedSlug === p.slug && (
              <ProductEditor
                slug={p.slug}
                initial={{
                  name: p.name,
                  summary: p.summary,
                  tempRangeMinC: p.tempRangeMinC,
                  tempRangeMaxC: p.tempRangeMaxC,
                  shelfLifeDaysMin: p.shelfLifeDaysMin,
                  shelfLifeDaysMax: p.shelfLifeDaysMax,
                  recommendedContainerKind:
                    p.recommendedContainerKind as RecommendedContainerKind,
                }}
                varieties={p.varieties}
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

type ProductInitial = {
  name: string;
  summary: string | null;
  tempRangeMinC: number | null;
  tempRangeMaxC: number | null;
  shelfLifeDaysMin: number | null;
  shelfLifeDaysMax: number | null;
  recommendedContainerKind: RecommendedContainerKind;
};

function ProductEditor({
  slug,
  initial,
  varieties,
}: {
  slug: string;
  initial: ProductInitial;
  varieties: {
    id: string;
    name: string;
    boxWeightKg: number;
    boxDimensions: string | null;
    palletConfig: string | null;
  }[];
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState(initial);

  const updateMut = trpc.admin.updateProduct.useMutation({
    onSuccess: () => utils.admin.listProducts.invalidate(),
  });

  const onSave = () => {
    updateMut.mutate({ slug, ...form });
  };

  return (
    <div className="border-t border-black/5 px-4 py-4 space-y-5 bg-luma-sand/25">
      {/* Campos editáveis */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Nome">
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </Field>
        <Field label="Container recomendado">
          <select
            className={inputCls}
            value={form.recommendedContainerKind}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                recommendedContainerKind: e.target.value as RecommendedContainerKind,
              }))
            }
          >
            {CONTAINER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Temp mín (°C)">
          <input
            type="number"
            step="0.5"
            className={inputCls}
            value={form.tempRangeMinC ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tempRangeMinC: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
          />
        </Field>
        <Field label="Temp máx (°C)">
          <input
            type="number"
            step="0.5"
            className={inputCls}
            value={form.tempRangeMaxC ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tempRangeMaxC: e.target.value === '' ? null : Number(e.target.value),
              }))
            }
          />
        </Field>
        <Field label="Shelf life mín (dias)">
          <input
            type="number"
            min="0"
            className={inputCls}
            value={form.shelfLifeDaysMin ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                shelfLifeDaysMin:
                  e.target.value === '' ? null : Number(e.target.value),
              }))
            }
          />
        </Field>
        <Field label="Shelf life máx (dias)">
          <input
            type="number"
            min="0"
            className={inputCls}
            value={form.shelfLifeDaysMax ?? ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                shelfLifeDaysMax:
                  e.target.value === '' ? null : Number(e.target.value),
              }))
            }
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Descrição">
            <textarea
              rows={2}
              className={cn(inputCls, 'resize-none')}
              value={form.summary ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary: e.target.value || null }))
              }
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={updateMut.isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-luma-olive px-3 py-1.5 text-[12.5px] font-medium text-luma-offwhite shadow-sm transition hover:brightness-110 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" strokeWidth={1.75} />
          {updateMut.isPending ? 'Salvando…' : 'Salvar produto'}
        </button>
        {updateMut.isSuccess && (
          <span className="text-[11.5px] text-luma-olive">✓ salvo</span>
        )}
        {updateMut.error && (
          <span className="text-[11.5px] text-[hsl(var(--luma-earth))]">
            {updateMut.error.message}
          </span>
        )}
      </div>

      {/* Variedades */}
      <div>
        <p className="mb-2 text-[0.6rem] uppercase tracking-[0.26em] text-luma-olive/80">
          Variedades ({varieties.length})
        </p>
        <ul className="space-y-1.5">
          {varieties.map((v) => (
            <VarietyRow key={v.id} variety={v} />
          ))}
        </ul>
        <AddVarietyRow productSlug={slug} />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function VarietyRow({
  variety,
}: {
  variety: {
    id: string;
    name: string;
    boxWeightKg: number;
    boxDimensions: string | null;
    palletConfig: string | null;
  };
}) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: variety.name,
    boxWeightKg: variety.boxWeightKg,
    boxDimensions: variety.boxDimensions ?? '',
    palletConfig: variety.palletConfig ?? '',
  });

  const updateMut = trpc.admin.updateVariety.useMutation({
    onSuccess: () => {
      utils.admin.listProducts.invalidate();
      setEditing(false);
    },
  });
  const deleteMut = trpc.admin.deleteVariety.useMutation({
    onSuccess: () => utils.admin.listProducts.invalidate(),
  });

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 rounded-md bg-white/70 px-3 py-2 ring-1 ring-inset ring-black/5">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-luma-ink">{variety.name}</p>
          <p className="text-[10.5px] text-luma-ink/55">
            {variety.boxWeightKg} kg/cx
            {variety.boxDimensions && ` · ${variety.boxDimensions}`}
            {variety.palletConfig && ` · ${variety.palletConfig}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar"
            className="rounded-md p-1.5 text-luma-ink/60 transition hover:bg-luma-sand/60"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Excluir variedade "${variety.name}"?`)) {
                deleteMut.mutate({ id: variety.id });
              }
            }}
            disabled={deleteMut.isPending}
            aria-label="Excluir"
            className="rounded-md p-1.5 text-luma-ink/60 transition hover:bg-luma-earth/10 hover:text-luma-earth"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-md bg-white/80 px-3 py-2 ring-1 ring-inset ring-luma-olive/25">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <input
          className={inputCls}
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          type="number"
          step="0.1"
          className={inputCls}
          placeholder="kg/cx"
          value={form.boxWeightKg}
          onChange={(e) =>
            setForm((f) => ({ ...f, boxWeightKg: Number(e.target.value) || 0 }))
          }
        />
        <input
          className={inputCls}
          placeholder="Dimensões"
          value={form.boxDimensions}
          onChange={(e) => setForm((f) => ({ ...f, boxDimensions: e.target.value }))}
        />
        <input
          className={inputCls}
          placeholder="Pallet config"
          value={form.palletConfig}
          onChange={(e) => setForm((f) => ({ ...f, palletConfig: e.target.value }))}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            updateMut.mutate({
              id: variety.id,
              name: form.name,
              boxWeightKg: form.boxWeightKg,
              boxDimensions: form.boxDimensions || null,
              palletConfig: form.palletConfig || null,
            })
          }
          disabled={updateMut.isPending}
          className="inline-flex items-center gap-1 rounded-md bg-luma-olive px-2.5 py-1 text-[11.5px] font-medium text-luma-offwhite hover:brightness-110 disabled:opacity-60"
        >
          <Save className="h-3 w-3" strokeWidth={1.75} />
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2.5 py-1 text-[11.5px] text-luma-ink/70 ring-1 ring-inset ring-black/5 hover:bg-white"
        >
          <X className="h-3 w-3" strokeWidth={1.75} />
          Cancelar
        </button>
      </div>
    </li>
  );
}

function AddVarietyRow({ productSlug }: { productSlug: string }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    boxWeightKg: 4,
    boxDimensions: '',
    palletConfig: '',
  });

  const createMut = trpc.admin.createVariety.useMutation({
    onSuccess: () => {
      utils.admin.listProducts.invalidate();
      setOpen(false);
      setForm({ name: '', boxWeightKg: 4, boxDimensions: '', palletConfig: '' });
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/60 px-2.5 py-1 text-[11.5px] text-luma-olive ring-1 ring-inset ring-luma-olive/30 hover:bg-white"
      >
        <Plus className="h-3 w-3" strokeWidth={1.75} />
        Adicionar variedade
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md bg-white/80 px-3 py-2 ring-1 ring-inset ring-luma-olive/25">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <input
          className={inputCls}
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          type="number"
          step="0.1"
          className={inputCls}
          placeholder="kg/cx"
          value={form.boxWeightKg}
          onChange={(e) =>
            setForm((f) => ({ ...f, boxWeightKg: Number(e.target.value) || 0 }))
          }
        />
        <input
          className={inputCls}
          placeholder="Dimensões"
          value={form.boxDimensions}
          onChange={(e) => setForm((f) => ({ ...f, boxDimensions: e.target.value }))}
        />
        <input
          className={inputCls}
          placeholder="Pallet config"
          value={form.palletConfig}
          onChange={(e) => setForm((f) => ({ ...f, palletConfig: e.target.value }))}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            createMut.mutate({
              productSlug,
              name: form.name,
              boxWeightKg: form.boxWeightKg,
              boxDimensions: form.boxDimensions || null,
              palletConfig: form.palletConfig || null,
            })
          }
          disabled={createMut.isPending || !form.name}
          className="inline-flex items-center gap-1 rounded-md bg-luma-olive px-2.5 py-1 text-[11.5px] font-medium text-luma-offwhite hover:brightness-110 disabled:opacity-60"
        >
          <Plus className="h-3 w-3" strokeWidth={1.75} />
          Criar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2.5 py-1 text-[11.5px] text-luma-ink/70 ring-1 ring-inset ring-black/5 hover:bg-white"
        >
          <X className="h-3 w-3" strokeWidth={1.75} />
          Cancelar
        </button>
      </div>
      {createMut.error && (
        <p className="mt-1 text-[11px] text-[hsl(var(--luma-earth))]">
          {createMut.error.message}
        </p>
      )}
    </div>
  );
}
