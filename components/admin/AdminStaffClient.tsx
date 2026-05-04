'use client';

import { useState } from 'react';
import { Plus, Save, Trash2, UserPlus, X } from 'lucide-react';

import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

type StaffTeam = 'COMMERCIAL' | 'OPERATIONS' | 'COMPLIANCE' | 'ADMIN';
type UserRole = 'STAFF' | 'ADMIN';

const TEAM_LABEL: Record<StaffTeam, string> = {
  COMMERCIAL: 'Comercial',
  OPERATIONS: 'Operações',
  COMPLIANCE: 'Compliance',
  ADMIN: 'Administração',
};

const ROLE_LABEL: Record<UserRole, string> = {
  STAFF: 'Staff',
  ADMIN: 'Administrador',
};

const TEAMS: StaffTeam[] = ['COMMERCIAL', 'OPERATIONS', 'COMPLIANCE', 'ADMIN'];
const ROLES: UserRole[] = ['STAFF', 'ADMIN'];

const inputCls =
  'w-full rounded-md border border-black/10 bg-white/80 px-2.5 py-1.5 text-[13px] text-luma-ink outline-none focus:border-luma-olive focus:ring-2 focus:ring-luma-olive/25';
const labelCls =
  'text-[0.58rem] uppercase tracking-[0.22em] text-luma-olive/80 font-medium';

export function AdminStaffClient() {
  const utils = trpc.useUtils();
  const staffQ = trpc.staff.list.useQuery();
  const [showInvite, setShowInvite] = useState(false);

  const inviteM = trpc.staff.invite.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      setShowInvite(false);
    },
  });

  const updateM = trpc.staff.update.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });

  const removeM = trpc.staff.remove.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
  });

  return (
    <main className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-light text-luma-ink">Equipe</h2>
          <p className="text-[12px] text-luma-ink/60">
            Membros do time Luma com acesso ao Admin Console e Internal Control View.
            Convites são enviados por e-mail e o login é feito por magic link.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90"
        >
          {showInvite ? (
            <>
              <X className="h-3.5 w-3.5" strokeWidth={1.5} /> Cancelar
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" strokeWidth={1.5} /> Convidar
            </>
          )}
        </button>
      </div>

      {showInvite && (
        <InviteForm
          onSubmit={(data) => inviteM.mutate(data)}
          isPending={inviteM.isPending}
          error={inviteM.error?.message ?? null}
        />
      )}

      {staffQ.isLoading && (
        <p className="text-[11px] uppercase tracking-[0.28em] text-luma-ink/55">
          Carregando…
        </p>
      )}

      <ul className="space-y-2">
        {staffQ.data?.map((s) => (
          <StaffRow
            key={s.id}
            staff={s}
            onUpdate={(patch) => updateM.mutate({ staffId: s.id, ...patch })}
            onRemove={() => {
              if (
                confirm(
                  `Remover ${s.name ?? s.email}? O usuário perde acesso imediatamente.`,
                )
              ) {
                removeM.mutate({ staffId: s.id });
              }
            }}
            isUpdating={updateM.isPending}
            isRemoving={removeM.isPending}
          />
        ))}
        {staffQ.data && staffQ.data.length === 0 && (
          <li className="rounded-xl bg-white/50 p-6 text-center text-[12px] text-luma-ink/60">
            Nenhum membro cadastrado ainda.
          </li>
        )}
      </ul>

      {removeM.error && (
        <p className="text-[12px] text-red-700">{removeM.error.message}</p>
      )}
    </main>
  );
}

type InviteFormData = {
  email: string;
  name: string;
  role: UserRole;
  team: StaffTeam;
  title?: string;
};

function InviteForm({
  onSubmit,
  isPending,
  error,
}: {
  onSubmit: (data: InviteFormData) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [team, setTeam] = useState<StaffTeam>('COMMERCIAL');
  const [title, setTitle] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role,
          team,
          title: title.trim() || undefined,
        });
      }}
      className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className={labelCls}>Nome completo</label>
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
          <label className={labelCls}>Função</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={cn(inputCls, 'mt-1')}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value as StaffTeam)}
            className={cn(inputCls, 'mt-1')}
          >
            {TEAMS.map((t) => (
              <option key={t} value={t}>
                {TEAM_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Cargo (opcional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Gerente Comercial"
            className={cn(inputCls, 'mt-1')}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-[12px] text-red-700">{error}</p>}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          {isPending ? 'Enviando…' : 'Enviar convite'}
        </button>
      </div>
    </form>
  );
}

type StaffRowData = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  team: string;
  title: string | null;
  createdAt: Date;
};

function StaffRow({
  staff,
  onUpdate,
  onRemove,
  isUpdating,
  isRemoving,
}: {
  staff: StaffRowData;
  onUpdate: (patch: { role?: UserRole; team?: StaffTeam; title?: string | null }) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState<UserRole>(staff.role as UserRole);
  const [team, setTeam] = useState<StaffTeam>(staff.team as StaffTeam);
  const [title, setTitle] = useState(staff.title ?? '');

  return (
    <li className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-black/5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-medium text-luma-ink">
            {staff.name ?? staff.email}
          </p>
          <p className="text-[11px] text-luma-ink/60">
            {staff.email} · {ROLE_LABEL[staff.role as UserRole] ?? staff.role} ·{' '}
            {TEAM_LABEL[staff.team as StaffTeam] ?? staff.team}
            {staff.title ? ` · ${staff.title}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md bg-white/80 px-2.5 py-1 text-[11px] font-medium text-luma-ink/75 ring-1 ring-inset ring-black/5 transition hover:text-luma-ink"
          >
            {editing ? 'Fechar' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving}
            className="rounded-md bg-white/80 p-1.5 text-luma-ink/55 ring-1 ring-inset ring-black/5 transition hover:text-red-700 disabled:opacity-50"
            aria-label="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className={labelCls}>Função</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={cn(inputCls, 'mt-1')}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value as StaffTeam)}
              className={cn(inputCls, 'mt-1')}
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>
                  {TEAM_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Cargo</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(inputCls, 'mt-1')}
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() =>
                onUpdate({
                  role,
                  team,
                  title: title.trim() || null,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-luma-olive px-3 py-1.5 text-[12px] font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
              {isUpdating ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
