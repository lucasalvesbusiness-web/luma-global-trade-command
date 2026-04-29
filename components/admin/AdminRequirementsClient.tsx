'use client';

import { useMemo, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type GateStatus =
  | 'PREVIEW_AVAILABLE'
  | 'REQUIREMENTS_PENDING'
  | 'DOCUMENTATION_REQUIRED'
  | 'SUBJECT_TO_FINAL_VALIDATION'
  | 'BLOCKED'
  | 'CLEARED_INTERNALLY';

const GATE_STATUSES: GateStatus[] = [
  'PREVIEW_AVAILABLE',
  'REQUIREMENTS_PENDING',
  'DOCUMENTATION_REQUIRED',
  'SUBJECT_TO_FINAL_VALIDATION',
  'BLOCKED',
  'CLEARED_INTERNALLY',
];

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2 py-1 text-[12px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';

export function AdminRequirementsClient() {
  return (
    <main className="p-6 space-y-8">
      <section>
        <h2 className="font-display text-xl font-light text-luma-ink">
          Matriz de requisitos
        </h2>
        <p className="text-[12px] text-luma-ink/60">
          Documentos exigidos por destino (país × produto) e gate de compliance.
        </p>
      </section>

      <DocumentRequirementsSection />
      <RequirementsMatrixSection />
    </main>
  );
}

// ============ Documents ============

function DocumentRequirementsSection() {
  const utils = trpc.useUtils();
  const listQ = trpc.admin.listDocumentRequirements.useQuery();
  const upsert = trpc.admin.upsertDocumentRequirement.useMutation({
    onSuccess: () => utils.admin.listDocumentRequirements.invalidate(),
  });
  const remove = trpc.admin.deleteDocumentRequirement.useMutation({
    onSuccess: () => {
      utils.admin.listDocumentRequirements.invalidate();
      utils.admin.listRequirementsMatrix.invalidate();
    },
  });

  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <section className="rounded-xl bg-white/70 p-5 ring-1 ring-inset ring-black/5">
      <header className="flex items-center justify-between">
        <h3 className="font-display text-lg font-light text-luma-ink">
          Documentos
        </h3>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite hover:bg-luma-olive/90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Novo documento
          </button>
        )}
      </header>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            upsert.mutate(
              { code, name, notes: notes || null },
              {
                onSuccess: () => {
                  setAdding(false);
                  setCode('');
                  setName('');
                  setNotes('');
                },
              },
            );
          }}
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4"
        >
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
            Código
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={40}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="md:col-span-2 text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={160}
              className={`${inputCls} mt-1`}
            />
          </label>
          <label className="text-[10px] uppercase tracking-[0.18em] text-luma-ink/55">
            Notas
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className={`${inputCls} mt-1`}
            />
          </label>
          <div className="md:col-span-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full bg-white/60 px-3 py-1.5 text-[12px] text-luma-ink/70 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={upsert.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite hover:bg-luma-olive/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
              Salvar
            </button>
          </div>
        </form>
      )}

      <ul className="mt-4 space-y-1">
        {listQ.data?.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-md bg-luma-sand/30 px-3 py-1.5 text-[12.5px]"
          >
            <span>
              <span className="font-mono text-[11px] text-luma-olive mr-2">
                {d.code}
              </span>
              {d.name}
              {d.notes && (
                <span className="ml-2 text-luma-ink/55">— {d.notes}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Remover ${d.code}?`)) remove.mutate({ id: d.id });
              }}
              className="rounded-full bg-white/60 p-1 text-red-700 hover:bg-white"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </li>
        ))}
        {!listQ.isLoading && (listQ.data?.length ?? 0) === 0 && (
          <li className="text-[12px] text-luma-ink/45">Nenhum documento cadastrado.</li>
        )}
      </ul>
      {remove.error && (
        <p className="mt-2 text-[11px] text-red-700">{remove.error.message}</p>
      )}
    </section>
  );
}

// ============ Matrix ============

type RequirementCell = {
  id: string;
  productId: string;
  countryIso2: string;
  notes: string | null;
  product: { slug: string; name: string };
  country: { iso2: string; name: string };
  items: {
    id: string;
    documentRequirementId: string;
    mandatory: boolean;
    document: { id: string; code: string; name: string };
  }[];
};

type GateCell = {
  id: string;
  status: GateStatus;
  notes: string | null;
  product: { slug: string };
  country: { iso2: string };
};

type DocumentRequirement = {
  id: string;
  code: string;
  name: string;
  notes: string | null;
};

function RequirementsMatrixSection() {
  const matrixQ = trpc.admin.listRequirementsMatrix.useQuery();
  const refsQ = trpc.admin.refsForForms.useQuery();
  const docsQ = trpc.admin.listDocumentRequirements.useQuery();

  const cells = useMemo(() => {
    const map = new Map<string, RequirementCell>();
    (matrixQ.data?.requirements as RequirementCell[] | undefined)?.forEach((r) => {
      map.set(`${r.product.slug}::${r.country.iso2}`, r);
    });
    return map;
  }, [matrixQ.data]);

  const gates = useMemo(() => {
    const map = new Map<string, GateCell>();
    (matrixQ.data?.gates as GateCell[] | undefined)?.forEach((g) => {
      map.set(`${g.product.slug}::${g.country.iso2}`, g);
    });
    return map;
  }, [matrixQ.data]);

  const [editing, setEditing] = useState<{
    productSlug: string;
    countryIso2: string;
  } | null>(null);

  if (matrixQ.isLoading || refsQ.isLoading || docsQ.isLoading) {
    return (
      <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
        Carregando matriz…
      </p>
    );
  }

  const products = refsQ.data?.products ?? [];
  const countries = refsQ.data?.countries ?? [];

  return (
    <section className="rounded-xl bg-white/70 p-5 ring-1 ring-inset ring-black/5">
      <header>
        <h3 className="font-display text-lg font-light text-luma-ink">
          Matriz país × produto
        </h3>
        <p className="text-[12px] text-luma-ink/60">
          Clique em uma célula para editar requisitos e gate de compliance.
        </p>
      </header>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-[12px]">
          <thead className="bg-luma-sand/40 text-[10px] uppercase tracking-[0.16em] text-luma-ink/60">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Produto / País</th>
              {countries.map((c) => (
                <th
                  key={c.iso2}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  {c.iso2} {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map((p) => (
              <tr key={p.slug} className="hover:bg-luma-sand/15">
                <td className="px-3 py-2 font-medium text-luma-ink/85 whitespace-nowrap">
                  {p.name}
                </td>
                {countries.map((c) => {
                  const key = `${p.slug}::${c.iso2}`;
                  const req = cells.get(key);
                  const gate = gates.get(key);
                  return (
                    <td key={key} className="px-3 py-2 align-top">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({ productSlug: p.slug, countryIso2: c.iso2 })
                        }
                        className={cn(
                          'block w-full rounded-md px-2 py-1.5 text-left text-[11px] ring-1 ring-inset transition',
                          req
                            ? 'bg-luma-field/15 ring-luma-field/30 hover:bg-luma-field/25'
                            : 'bg-white/40 ring-black/5 hover:bg-white',
                        )}
                      >
                        <span className="block font-medium text-luma-ink/85">
                          {req ? `${req.items.length} doc${req.items.length === 1 ? '' : 's'}` : '—'}
                        </span>
                        <span className="block text-[10px] text-luma-ink/60">
                          {gate
                            ? gate.status.replaceAll('_', ' ').toLowerCase()
                            : 'sem gate'}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <RequirementCellEditor
          productSlug={editing.productSlug}
          countryIso2={editing.countryIso2}
          requirement={cells.get(`${editing.productSlug}::${editing.countryIso2}`)}
          gate={gates.get(`${editing.productSlug}::${editing.countryIso2}`)}
          documents={docsQ.data ?? []}
          productName={
            products.find((x) => x.slug === editing.productSlug)?.name ?? ''
          }
          countryName={
            countries.find((x) => x.iso2 === editing.countryIso2)?.name ?? ''
          }
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function RequirementCellEditor({
  productSlug,
  countryIso2,
  requirement,
  gate,
  documents,
  productName,
  countryName,
  onClose,
}: {
  productSlug: string;
  countryIso2: string;
  requirement?: RequirementCell;
  gate?: GateCell;
  documents: DocumentRequirement[];
  productName: string;
  countryName: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const upsertReq = trpc.admin.upsertRequirement.useMutation({
    onSuccess: () => utils.admin.listRequirementsMatrix.invalidate(),
  });
  const upsertGate = trpc.admin.upsertComplianceGate.useMutation({
    onSuccess: () => utils.admin.listRequirementsMatrix.invalidate(),
  });
  const removeReq = trpc.admin.deleteRequirement.useMutation({
    onSuccess: () => utils.admin.listRequirementsMatrix.invalidate(),
  });

  const [notes, setNotes] = useState(requirement?.notes ?? '');
  const [items, setItems] = useState<{ documentRequirementId: string; mandatory: boolean }[]>(
    requirement?.items.map((i) => ({
      documentRequirementId: i.documentRequirementId,
      mandatory: i.mandatory,
    })) ?? [],
  );
  const [gateStatus, setGateStatus] = useState<GateStatus>(
    gate?.status ?? 'PREVIEW_AVAILABLE',
  );
  const [gateNotes, setGateNotes] = useState(gate?.notes ?? '');

  const toggle = (docId: string) => {
    setItems((prev) => {
      if (prev.find((p) => p.documentRequirementId === docId)) {
        return prev.filter((p) => p.documentRequirementId !== docId);
      }
      return [...prev, { documentRequirementId: docId, mandatory: true }];
    });
  };
  const setMandatory = (docId: string, mandatory: boolean) => {
    setItems((prev) =>
      prev.map((p) =>
        p.documentRequirementId === docId ? { ...p, mandatory } : p,
      ),
    );
  };

  const save = async () => {
    await upsertReq.mutateAsync({
      productSlug,
      countryIso2,
      notes: notes || null,
      documentRequirementIds: items,
    });
    await upsertGate.mutateAsync({
      productSlug,
      countryIso2,
      status: gateStatus,
      notes: gateNotes || null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-svh w-full max-w-xl overflow-y-auto bg-luma-offwhite p-6 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-luma-olive/85">
              {countryIso2} · {countryName}
            </p>
            <h3 className="mt-0.5 font-display text-xl font-light text-luma-ink">
              {productName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/60 p-2 text-luma-ink/70 hover:bg-white"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>

        <section className="mt-5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-luma-ink/55">
            Documentos exigidos
          </p>
          <ul className="space-y-1.5 rounded-xl bg-white/70 p-3 ring-1 ring-inset ring-black/5">
            {documents.map((d) => {
              const sel = items.find((i) => i.documentRequirementId === d.id);
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 text-[12px] text-luma-ink/85"
                >
                  <input
                    type="checkbox"
                    checked={!!sel}
                    onChange={() => toggle(d.id)}
                  />
                  <span className="flex-1">
                    <span className="font-mono text-[11px] text-luma-olive mr-2">
                      {d.code}
                    </span>
                    {d.name}
                  </span>
                  {sel && (
                    <label className="flex items-center gap-1 text-[10.5px] uppercase tracking-[0.18em] text-luma-ink/60">
                      <input
                        type="checkbox"
                        checked={sel.mandatory}
                        onChange={(e) => setMandatory(d.id, e.target.checked)}
                      />
                      obrigatório
                    </label>
                  )}
                </li>
              );
            })}
            {documents.length === 0 && (
              <li className="text-[12px] text-luma-ink/45">
                Cadastre documentos primeiro.
              </li>
            )}
          </ul>
        </section>

        <label className="mt-4 block text-[10px] uppercase tracking-[0.22em] text-luma-ink/55">
          Notas (requisitos)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={800}
            rows={3}
            className="mt-1 w-full rounded-md border border-black/10 bg-white/80 p-2 text-[12px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25"
          />
        </label>

        <section className="mt-5 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.22em] text-luma-ink/55">
            Compliance gate
          </p>
          <select
            value={gateStatus}
            onChange={(e) => setGateStatus(e.target.value as GateStatus)}
            className="w-full rounded-md border border-black/10 bg-white/80 px-2 py-1.5 text-[12px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25"
          >
            {GATE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>
          <textarea
            value={gateNotes}
            onChange={(e) => setGateNotes(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Notas do gate (opcional)"
            className="mt-2 w-full rounded-md border border-black/10 bg-white/80 p-2 text-[12px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25"
          />
        </section>

        <footer className="mt-6 flex items-center justify-between gap-2">
          {requirement && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Remover requisitos para esta célula?')) {
                  removeReq.mutate(
                    { id: requirement.id },
                    { onSuccess: onClose },
                  );
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-1.5 text-[12px] text-red-700 hover:bg-white"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Remover
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/60 px-3 py-1.5 text-[12px] text-luma-ink/70 hover:bg-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={upsertReq.isPending || upsertGate.isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-luma-offwhite hover:bg-luma-olive/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
              Salvar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
