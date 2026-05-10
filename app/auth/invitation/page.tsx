import Link from 'next/link';

import { auth } from '@/server/auth/config';
import { previewInvitation } from '@/server/trpc/routers/members';
import { GridBackground } from '@/components/ui/GridBackground';
import { TechLabel } from '@/components/ui/TechLabel';
import { InvitationActionClient } from '@/components/auth/InvitationActionClient';

const ROLE_LABELS_PT: Record<string, string> = {
  OWNER: 'Proprietário(a)',
  COMMERCIAL: 'Comercial',
  OPERATIONS: 'Operação',
  FINANCE: 'Financeiro',
};

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Shell>
        <h1 className="display-xl mb-2 text-2xl text-ink-50">Convite inválido</h1>
        <p className="text-sm text-ink-300">Sem token de convite. Verifique o link.</p>
      </Shell>
    );
  }

  const preview = await previewInvitation(token);
  if (!preview) {
    return (
      <Shell>
        <h1 className="display-xl mb-2 text-2xl text-ink-50">Convite não encontrado</h1>
        <p className="text-sm text-ink-300">O link pode estar errado ou já foi revogado.</p>
      </Shell>
    );
  }

  if (preview.status !== 'PENDING' || preview.expired) {
    const reason =
      preview.status === 'ACCEPTED'
        ? 'Já aceito.'
        : preview.status === 'REVOKED'
          ? 'Revogado pelo proprietário.'
          : 'Expirado.';
    return (
      <Shell>
        <TechLabel className="mb-2">Convite inativo</TechLabel>
        <h1 className="display-xl mb-2 text-2xl text-ink-50">Convite não está mais ativo</h1>
        <p className="text-sm text-ink-300">{reason} Peça um novo convite ao proprietário.</p>
      </Shell>
    );
  }

  const session = await auth();
  const companyName = preview.company.tradeName ?? preview.company.legalName;
  const inviterName = preview.inviter.name ?? preview.inviter.email;
  const roleLabel = ROLE_LABELS_PT[preview.role] ?? preview.role;
  const sessionEmailMatches =
    !!session?.user?.email &&
    session.user.email.toLowerCase() === preview.email.toLowerCase();

  return (
    <Shell>
      <TechLabel dot className="mb-3">
        Convite recebido
      </TechLabel>
      <h1 className="display-xl mb-3 text-3xl text-ink-50">
        Você foi convidado(a) para{' '}
        <span className="text-amber-glow">{companyName}</span>
      </h1>
      <p className="mb-6 text-sm text-ink-300">
        <span className="text-ink-200">{inviterName}</span> está convidando você para entrar
        como <span className="text-ink-200">{roleLabel}</span> na rede.
      </p>

      <dl className="mb-8 space-y-1 border-y border-white/[0.05] py-4 font-mono text-[12px]">
        <Row label="Email do convite" value={preview.email} />
        <Row label="Empresa" value={companyName} />
        <Row label="Função" value={roleLabel} />
        <Row label="Expira em" value={new Date(preview.expiresAt).toLocaleString('pt-BR')} />
      </dl>

      {!session?.user ? (
        <div className="rounded-md border border-white/[0.07] bg-ink-850 p-4">
          <p className="mb-3 text-xs text-ink-300">
            Faça login com o email <strong>{preview.email}</strong> para aceitar o convite.
          </p>
          <Link
            href={`/auth/sign-in?callbackUrl=${encodeURIComponent(
              `/auth/invitation?token=${token}`,
            )}`}
            className="inline-flex h-10 items-center rounded-md border border-amber/60 bg-amber/10 px-5 text-xs uppercase tracking-wider text-amber-glow transition-colors hover:bg-amber/20"
          >
            Entrar / cadastrar →
          </Link>
        </div>
      ) : !sessionEmailMatches ? (
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-4">
          <p className="text-xs text-yellow-300">
            Você está logado(a) como <code>{session.user.email}</code>, mas o convite foi
            enviado para <code>{preview.email}</code>. Saia e entre com o email correto.
          </p>
        </div>
      ) : (
        <InvitationActionClient token={token} companySlug={preview.company.slug} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-spectre-carbon p-6">
      <GridBackground fade radial />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(201,169,104,0.07), transparent 60%)',
        }}
      />
      <div className="relative w-full max-w-xl">
        <div className="surface-graphite relative overflow-hidden rounded-md border border-white/[0.07] p-8">
          <div className="tick-tl text-amber" />
          <div className="tick-tr text-amber" />
          <div className="tick-bl text-amber" />
          <div className="tick-br text-amber" />
          {children}
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="tech-label">{label}</dt>
      <dd className="text-ink-100">{value}</dd>
    </div>
  );
}
