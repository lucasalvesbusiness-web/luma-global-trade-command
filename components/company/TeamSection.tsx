'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TechLabel } from '@/components/ui/TechLabel';
import { trpc } from '@/lib/trpc/react';
import { cn } from '@/lib/utils';

const ROLE_LABELS_PT: Record<string, string> = {
  OWNER: 'Proprietário(a)',
  COMMERCIAL: 'Comercial',
  OPERATIONS: 'Operação',
  FINANCE: 'Financeiro',
};

type Role = 'OWNER' | 'COMMERCIAL' | 'OPERATIONS' | 'FINANCE';

export function TeamSection() {
  const list = trpc.members.list.useQuery();
  const invite = trpc.members.invite.useMutation();
  const revoke = trpc.members.revoke.useMutation();
  const removeMember = trpc.members.removeMember.useMutation();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('OPERATIONS');
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await invite.mutateAsync({ email: email.trim(), role });
      setEmail('');
      list.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function handleRevoke(invitationId: string) {
    setError(null);
    try {
      await revoke.mutateAsync({ invitationId });
      list.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remover este membro?')) return;
    setError(null);
    try {
      await removeMember.mutateAsync({ memberId });
      list.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    }
  }

  const data = list.data;
  const members = data?.members ?? [];
  const invitations = data?.invitations ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <div className="flex items-center gap-3">
          <span className="num-marker text-xs text-amber/80">§05</span>
          <h2 className="display-md text-lg text-ink-50">Equipe</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-400">
          Convide membros para sua empresa. Eles podem abrir e operar deals em nome dela.
          Apenas <span className="text-ink-200">Proprietário(a)</span> gerencia membros e edita
          a empresa.
        </p>
      </header>

      {/* Active members */}
      <div>
        <TechLabel className="mb-3">Membros · {members.length}</TechLabel>
        {members.length === 0 ? (
          <p className="rounded-md border border-dashed border-white/10 px-4 py-6 text-center text-xs text-ink-500">
            {list.isLoading ? 'Carregando…' : 'Sem membros.'}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-md border border-white/[0.07] font-mono text-[12px]">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink-800 text-[10px] text-ink-300">
                  {((m.name ?? m.email).split('@')[0] ?? '??')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-ink-100">{m.name ?? '—'}</p>
                  <p className="text-[10px] text-ink-500">{m.email}</p>
                </div>
                <span
                  className={cn(
                    'rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider',
                    m.role === 'OWNER'
                      ? 'border-amber/40 bg-amber/10 text-amber-glow'
                      : 'border-white/15 bg-ink-800 text-ink-300',
                  )}
                >
                  {ROLE_LABELS_PT[m.role] ?? m.role}
                </span>
                {m.role !== 'OWNER' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(m.id)}
                    disabled={removeMember.isPending}
                  >
                    Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <TechLabel className="mb-3">Convites pendentes · {invitations.length}</TechLabel>
          <ul className="overflow-hidden rounded-md border border-white/[0.07] font-mono text-[12px]">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-ink-100">{inv.email}</p>
                  <p className="text-[10px] text-ink-500">
                    expira em {new Date(inv.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="rounded-sm border border-white/15 bg-ink-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-300">
                  {ROLE_LABELS_PT[inv.role] ?? inv.role}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevoke(inv.id)}
                  disabled={revoke.isPending}
                >
                  Revogar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite form */}
      <form
        onSubmit={handleInvite}
        className="rounded-md border border-dashed border-white/10 p-4"
      >
        <TechLabel className="mb-3">Convidar membro</TechLabel>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="colega@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Função</Label>
            <select
              id="invite-role"
              className="h-10 rounded-md border border-white/10 bg-ink-800 px-2 text-xs text-ink-100 focus:border-amber/60 focus:outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="COMMERCIAL">Comercial</option>
              <option value="OPERATIONS">Operação</option>
              <option value="FINANCE">Financeiro</option>
              <option value="OWNER">Proprietário(a)</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={!email || invite.isPending} className="w-full">
              {invite.isPending ? 'Enviando…' : 'Enviar →'}
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <p className="mt-3 text-[10px] text-ink-500">
          O convite expira em 72h. Limite: 5 convites/dia.
        </p>
      </form>
    </div>
  );
}
