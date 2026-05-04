'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Pause,
  Play,
  Plus,
  Save,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';
const labelCls =
  'text-[0.58rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium';

const STATUS_BADGE: Record<
  string,
  { label: string; cls: string }
> = {
  UP_TO_DATE: { label: 'Em dia', cls: 'bg-luma-field/15 text-luma-field' },
  DUE_SOON: { label: 'Vence em breve', cls: 'bg-luma-sun/20 text-amber-800' },
  OVERDUE: { label: 'Atrasada', cls: 'bg-red-100 text-red-700' },
  PAUSED: { label: 'Pausada', cls: 'bg-black/5 text-luma-ink/55' },
  NEVER_SUBMITTED: { label: 'Nunca submeteu', cls: 'bg-black/5 text-luma-ink/55' },
};

export function AdminOriginDetailClient({ slug }: { slug: string }) {
  const utils = trpc.useUtils();
  const originQ = trpc.origin.get.useQuery({ slug });
  const [showNewPlot, setShowNewPlot] = useState(false);
  const [showInviteOp, setShowInviteOp] = useState(false);

  const updateRoutineM = trpc.origin.updateRoutine.useMutation({
    onSuccess: () => utils.origin.get.invalidate({ slug }),
  });
  const deletePlotM = trpc.origin.deletePlot.useMutation({
    onSuccess: () => utils.origin.get.invalidate({ slug }),
  });
  const removeOpM = trpc.origin.removeOperator.useMutation({
    onSuccess: () => utils.origin.get.invalidate({ slug }),
  });

  if (originQ.isLoading) {
    return (
      <main className="p-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      </main>
    );
  }
  if (!originQ.data) return null;

  const o = originQ.data;

  return (
    <main className="space-y-6 p-6">
      <div>
        <Link
          href="/admin/origins"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.24em] text-luma-ink/60 hover:text-luma-ink"
        >
          <ArrowLeft className="h-3 w-3" strokeWidth={1.5} /> Fazendas
        </Link>
        <div className="mt-1 flex items-baseline gap-3">
          <h2 className="font-display text-2xl font-light text-luma-ink">
            {o.name}
          </h2>
          {o.archivedAt && (
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-luma-ink/55">
              arquivada
            </span>
          )}
        </div>
        <p className="text-[12px] text-luma-ink/60">
          {o.region.name} · {o.kind.replace('_', ' ').toLowerCase()} ·{' '}
          <span className="font-mono">{o.slug}</span>
        </p>
      </div>

      {/* ============ Talhões + Rotinas ============ */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-light text-luma-ink">
            Talhões e rotinas fotográficas
          </h3>
          <button
            type="button"
            onClick={() => setShowNewPlot((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            {showNewPlot ? (
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            {showNewPlot ? 'Cancelar' : 'Novo talhão'}
          </button>
        </div>

        {showNewPlot && (
          <NewPlotForm
            originId={o.id}
            onDone={() => {
              setShowNewPlot(false);
              utils.origin.get.invalidate({ slug });
            }}
          />
        )}

        <ul className="mt-3 space-y-2">
          {o.plots.map((p) => {
            const badge =
              STATUS_BADGE[p.status] ?? STATUS_BADGE.NEVER_SUBMITTED!;
            return (
              <li
                key={p.id}
                className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base font-medium text-luma-ink">
                        {p.name}
                      </p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]',
                          badge.cls,
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-luma-ink/65">
                      {p.crop}
                      {p.areaHa ? ` · ${p.areaHa} ha` : ''}
                      {p.routine
                        ? ` · cadência ${p.routine.cadenceDays}d, mínimo ${p.routine.minPhotosPerCycle} fotos`
                        : ' · sem rotina configurada'}
                    </p>
                    {p.lastSubmissionAt && (
                      <p className="mt-0.5 text-[10.5px] text-luma-ink/55">
                        Última submissão:{' '}
                        {new Date(p.lastSubmissionAt).toLocaleDateString()}
                        {typeof p.daysSinceLastSubmission === 'number'
                          ? ` (há ${p.daysSinceLastSubmission} dias)`
                          : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {p.routine && (
                      <button
                        type="button"
                        onClick={() =>
                          updateRoutineM.mutate({
                            plotId: p.id,
                            active: !p.routine!.active,
                          })
                        }
                        className="rounded-md bg-white/80 p-1.5 text-luma-ink/55 ring-1 ring-inset ring-black/5 transition hover:text-luma-ink"
                        aria-label={p.routine.active ? 'Pausar' : 'Ativar'}
                        title={p.routine.active ? 'Pausar rotina' : 'Ativar rotina'}
                      >
                        {p.routine.active ? (
                          <Pause className="h-3.5 w-3.5" strokeWidth={1.5} />
                        ) : (
                          <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir talhão "${p.name}"? Submissões serão perdidas.`)) {
                          deletePlotM.mutate({ plotId: p.id });
                        }
                      }}
                      className="rounded-md bg-white/80 p-1.5 text-luma-ink/55 ring-1 ring-inset ring-black/5 transition hover:text-red-700"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {p.routine && (
                  <RoutineEditor
                    initial={{
                      cadenceDays: p.routine.cadenceDays,
                      minPhotosPerCycle: p.routine.minPhotosPerCycle,
                      instructions: p.routine.instructions ?? '',
                    }}
                    onSave={(patch) =>
                      updateRoutineM.mutate({ plotId: p.id, ...patch })
                    }
                    isSaving={updateRoutineM.isPending}
                  />
                )}
              </li>
            );
          })}
          {o.plots.length === 0 && (
            <li className="rounded-xl bg-white/50 p-6 text-center text-[12px] text-luma-ink/60">
              Nenhum talhão cadastrado.
            </li>
          )}
        </ul>
      </section>

      {/* ============ Operadores ============ */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-lg font-light text-luma-ink">
            Operadores de campo
          </h3>
          <button
            type="button"
            onClick={() => setShowInviteOp((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90"
          >
            {showInviteOp ? (
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            {showInviteOp ? 'Cancelar' : 'Convidar operador'}
          </button>
        </div>

        {showInviteOp && (
          <InviteOperatorForm
            originId={o.id}
            onDone={() => {
              setShowInviteOp(false);
              utils.origin.get.invalidate({ slug });
            }}
          />
        )}

        <ul className="mt-3 space-y-2">
          {o.fieldOperators.map((op) => (
            <li
              key={op.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-inset ring-black/5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-medium text-luma-ink">
                  {op.user.name ?? op.user.email}
                </p>
                <p className="text-[11px] text-luma-ink/60">
                  {op.user.email}
                  {op.title ? ` · ${op.title}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remover ${op.user.name ?? op.user.email}?`)) {
                    removeOpM.mutate({ operatorId: op.id });
                  }
                }}
                className="rounded-md bg-white/80 p-1.5 text-luma-ink/55 ring-1 ring-inset ring-black/5 transition hover:text-red-700"
                aria-label="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
          {o.fieldOperators.length === 0 && (
            <li className="rounded-xl bg-white/50 p-4 text-center text-[12px] text-luma-ink/60">
              Nenhum operador atribuído. Convide alguém pra fazer upload das fotos.
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}

function NewPlotForm({
  originId,
  onDone,
}: {
  originId: string;
  onDone: () => void;
}) {
  const createM = trpc.origin.createPlot.useMutation({ onSuccess: onDone });
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('');
  const [areaHa, setAreaHa] = useState('');
  const [cadenceDays, setCadenceDays] = useState('7');
  const [minPhotos, setMinPhotos] = useState('3');
  const [instructions, setInstructions] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createM.mutate({
          originId,
          name: name.trim(),
          crop: crop.trim(),
          areaHa: areaHa ? Number(areaHa) : null,
          cadenceDays: Number(cadenceDays),
          minPhotosPerCycle: Number(minPhotos),
          instructions: instructions.trim() || null,
        });
      }}
      className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={labelCls}>Nome do talhão</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Talhão A"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div>
          <label className={labelCls}>Cultura</label>
          <input
            required
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="Ex: Manga Tommy"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div>
          <label className={labelCls}>Área (ha)</label>
          <input
            type="number"
            step="0.01"
            value={areaHa}
            onChange={(e) => setAreaHa(e.target.value)}
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div>
          <label className={labelCls}>Cadência (dias)</label>
          <input
            type="number"
            min={1}
            max={180}
            value={cadenceDays}
            onChange={(e) => setCadenceDays(e.target.value)}
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div>
          <label className={labelCls}>Min. fotos por ciclo</label>
          <input
            type="number"
            min={1}
            max={50}
            value={minPhotos}
            onChange={(e) => setMinPhotos(e.target.value)}
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div className="md:col-span-3">
          <label className={labelCls}>Instruções para o operador</label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="O que precisa ser fotografado em cada submissão"
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
          {createM.isPending ? 'Criando…' : 'Criar talhão'}
        </button>
      </div>
    </form>
  );
}

function RoutineEditor({
  initial,
  onSave,
  isSaving,
}: {
  initial: { cadenceDays: number; minPhotosPerCycle: number; instructions: string };
  onSave: (patch: {
    cadenceDays?: number;
    minPhotosPerCycle?: number;
    instructions?: string | null;
  }) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [cadence, setCadence] = useState(String(initial.cadenceDays));
  const [minP, setMinP] = useState(String(initial.minPhotosPerCycle));
  const [instr, setInstr] = useState(initial.instructions);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-[10.5px] uppercase tracking-[0.22em] text-luma-olive/85 hover:text-luma-olive"
      >
        Editar rotina
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-luma-offwhite/60 p-3 ring-1 ring-inset ring-black/5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Cadência (dias)</label>
          <input
            type="number"
            min={1}
            max={180}
            value={cadence}
            onChange={(e) => setCadence(e.target.value)}
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div>
          <label className={labelCls}>Min. fotos</label>
          <input
            type="number"
            min={1}
            max={50}
            value={minP}
            onChange={(e) => setMinP(e.target.value)}
            className={cn(inputCls, 'mt-1 font-mono')}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Instruções</label>
          <textarea
            rows={2}
            value={instr}
            onChange={(e) => setInstr(e.target.value)}
            className={cn(inputCls, 'mt-1')}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-medium text-luma-ink/75 ring-1 ring-inset ring-black/5"
        >
          Fechar
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            onSave({
              cadenceDays: Number(cadence),
              minPhotosPerCycle: Number(minP),
              instructions: instr.trim() || null,
            });
            setOpen(false);
          }}
          className="inline-flex items-center gap-1 rounded-md bg-luma-olive px-2.5 py-1 text-[11px] font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-3 w-3" strokeWidth={1.5} />
          Salvar
        </button>
      </div>
    </div>
  );
}

function InviteOperatorForm({
  originId,
  onDone,
}: {
  originId: string;
  onDone: () => void;
}) {
  const inviteM = trpc.origin.inviteOperator.useMutation({ onSuccess: onDone });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        inviteM.mutate({
          originId,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          title: title.trim() || undefined,
        });
      }}
      className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={labelCls}>Nome</label>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(inputCls, 'mt-1')}
          />
        </div>
        <div>
          <label className={labelCls}>Cargo (opcional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Encarregado de campo"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
      </div>
      {inviteM.error && (
        <p className="mt-3 text-[12px] text-red-700">{inviteM.error.message}</p>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={inviteM.isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          {inviteM.isPending ? 'Enviando…' : 'Enviar convite'}
        </button>
      </div>
    </form>
  );
}
