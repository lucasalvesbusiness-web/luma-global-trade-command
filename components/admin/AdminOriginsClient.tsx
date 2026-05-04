'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  Plus,
  Sprout,
  X,
} from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type OriginKind = 'OWN_FARM' | 'AUDITED_PARTNER' | 'AGROINDUSTRIAL_UNIT';

const KIND_LABEL: Record<OriginKind, string> = {
  OWN_FARM: 'Fazenda própria',
  AUDITED_PARTNER: 'Parceiro auditado',
  AGROINDUSTRIAL_UNIT: 'Unidade agroindustrial',
};

const KINDS: OriginKind[] = ['OWN_FARM', 'AUDITED_PARTNER', 'AGROINDUSTRIAL_UNIT'];

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';
const labelCls =
  'text-[0.58rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium';

export function AdminOriginsClient() {
  const utils = trpc.useUtils();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const originsQ = trpc.origin.list.useQuery({ includeArchived });

  const archiveM = trpc.origin.archive.useMutation({
    onSuccess: () => utils.origin.list.invalidate(),
  });
  const restoreM = trpc.origin.restore.useMutation({
    onSuccess: () => utils.origin.list.invalidate(),
  });

  return (
    <main className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-light text-luma-ink">Fazendas</h2>
          <p className="text-[12px] text-luma-ink/60">
            Cadastro de origens (fazendas, parceiros, unidades). Cada fazenda tem
            talhões com rotinas semanais de fotos atualizadas pelos operadores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-luma-ink/70">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-3.5 w-3.5 accent-luma-olive"
            />
            Incluir arquivadas
          </label>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            {showCreate ? (
              <>
                <X className="h-3.5 w-3.5" strokeWidth={1.5} /> Cancelar
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Nova fazenda
              </>
            )}
          </button>
        </div>
      </div>

      {showCreate && <CreateOriginForm onDone={() => setShowCreate(false)} />}

      {originsQ.isLoading && (
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      )}

      <ul className="space-y-2">
        {originsQ.data?.map((o) => (
          <li
            key={o.id}
            className={cn(
              'rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5',
              o.archivedAt && 'opacity-60',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/admin/origins/${o.slug}`}
                className="group flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-luma-olive/10">
                  <Sprout className="h-4 w-4 text-luma-olive" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base font-medium text-luma-ink group-hover:text-luma-olive">
                    {o.name}
                    {o.archivedAt && (
                      <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-luma-ink/55">
                        arquivada
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-luma-ink/60">
                    {KIND_LABEL[o.kind as OriginKind]} · {o.region.name} ·{' '}
                    {o.plotCount} talhões · {o.operatorCount} operador
                    {o.operatorCount === 1 ? '' : 'es'}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-1">
                {o.archivedAt ? (
                  <button
                    type="button"
                    onClick={() => restoreM.mutate({ id: o.id })}
                    className="rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium text-luma-ink/75 ring-1 ring-inset ring-black/5 transition hover:text-luma-ink"
                  >
                    <ArchiveRestore className="inline h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="ml-1">Restaurar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Arquivar "${o.name}"?`)) {
                        archiveM.mutate({ id: o.id });
                      }
                    }}
                    className="rounded-md bg-white/80 p-1.5 text-luma-ink/55 ring-1 ring-inset ring-black/5 transition hover:text-luma-ink"
                    aria-label="Arquivar"
                  >
                    <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                )}
                <Link
                  href={`/admin/origins/${o.slug}`}
                  className="rounded-md bg-white/80 p-1.5 text-luma-ink/55 ring-1 ring-inset ring-black/5 transition hover:text-luma-ink"
                  aria-label="Abrir"
                >
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </li>
        ))}
        {originsQ.data && originsQ.data.length === 0 && (
          <li className="rounded-xl bg-white/50 p-6 text-center text-[12px] text-luma-ink/60">
            Nenhuma fazenda cadastrada.
          </li>
        )}
      </ul>
    </main>
  );
}

function CreateOriginForm({ onDone }: { onDone: () => void }) {
  const utils = trpc.useUtils();
  const regionsQ = trpc.origin.listRegions.useQuery();
  const createM = trpc.origin.create.useMutation({
    onSuccess: () => {
      utils.origin.list.invalidate();
      onDone();
    },
  });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [kind, setKind] = useState<OriginKind>('OWN_FARM');
  const [regionId, setRegionId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [statusBlurb, setStatusBlurb] = useState('');
  const [certs, setCerts] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createM.mutate({
          name: name.trim(),
          slug: slug.trim(),
          kind,
          regionId,
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null,
          statusBlurb: statusBlurb.trim() || null,
          approvedCertifications: certs
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }}
      className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={labelCls}>Nome</label>
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[̀-ͯ]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, ''),
                );
              }
            }}
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ex: fazenda-vale-norte"
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div>
          <label className={labelCls}>Tipo</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as OriginKind)}
            className={cn(inputCls, 'mt-1')}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Região</label>
          <select
            required
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
            className={cn(inputCls, 'mt-1')}
          >
            <option value="">Selecione…</option>
            {regionsQ.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Latitude</label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="-12.345"
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div>
          <label className={labelCls}>Longitude</label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="-45.678"
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Status público (curto)</label>
          <input
            value={statusBlurb}
            onChange={(e) => setStatusBlurb(e.target.value)}
            placeholder="ex: Colheita ativa, qualidade premium"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Certificações (vírgula)</label>
          <input
            value={certs}
            onChange={(e) => setCerts(e.target.value)}
            placeholder="GlobalGAP, Rainforest, Organic"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
      </div>
      {createM.error && (
        <p className="mt-3 text-[12px] text-red-700">{createM.error.message}</p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={createM.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          {createM.isPending ? 'Criando…' : 'Criar fazenda'}
        </button>
      </div>
    </form>
  );
}
