import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import type { CompanyMemberRole } from '@/lib/types/enums';
import { repositories } from '@/server/repositories';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { StatusChip } from '@/components/ui/StatusChip';
import { TechLabel } from '@/components/ui/TechLabel';
import { dealRoomStatusLabels } from '@/lib/status/enums';

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/inbox');
  if (!session.user.companyId) redirect('/start');

  const companyId = session.user.companyId;

  const [pendingReviews, deals, recentEvents] = await Promise.all([
    db.review.findMany({
      where: { raterCompanyId: companyId, submittedAt: null },
      include: {
        ratedCompany: { select: { slug: true, legalName: true, tradeName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    repositories.dealRoom.listForCompany(companyId),
    db.auditEvent.findMany({
      where: { entityType: 'DealRoom' },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  // Deals waiting on you
  const waitingOnYou = deals.filter((d) => {
    const isBuyer = d.buyerCompanyId === companyId;
    if (d.status === 'SCOPED' && !isBuyer) return true; // supplier needs to quote
    if (d.status === 'QUOTED' && isBuyer) return true; // buyer accepts
    if (d.status === 'DELIVERED' && isBuyer) return true; // buyer confirms
    if (d.status === 'OPENED') return true; // both can scope
    return false;
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <Reveal>
        <header className="mb-10 flex items-end justify-between">
          <div>
            <TechLabel dot className="mb-2">
              Caixa
            </TechLabel>
            <h1 className="display-xl text-3xl text-ink-50 md:text-4xl">Centro operacional</h1>
            <p className="mt-2 text-sm text-ink-300">
              Pendências, deals em movimento, atividade recente da rede.
            </p>
          </div>
        </header>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Pending reviews */}
          <Section
            code="§00"
            title="Reviews pendentes"
            count={pendingReviews.length}
            empty="Sem avaliações pendentes."
          >
            {pendingReviews.map((r) => (
              <Row
                key={r.id}
                href={`/d/${r.dealRoomId}`}
                meta={
                  <span className="text-amber/80">avaliar</span>
                }
                title={r.ratedCompany.tradeName ?? r.ratedCompany.legalName}
                sub="Negócio concluído · clique para abrir o deal"
              />
            ))}
          </Section>

          {/* Waiting on you */}
          <Section
            code="§01"
            title="Aguardando ação sua"
            count={waitingOnYou.length}
            empty="Nenhum deal aguardando você."
          >
            {waitingOnYou.map((d) => {
              const isBuyer = d.buyerCompanyId === companyId;
              const counterparty = isBuyer ? d.supplierCompany : d.buyerCompany;
              return (
                <Row
                  key={d.id}
                  href={`/d/${d.id}`}
                  meta={<StatusChip kind="dealRoom" value={d.status} />}
                  title={d.title}
                  sub={`${isBuyer ? 'Comprando de' : 'Vendendo para'} ${
                    counterparty.tradeName ?? counterparty.legalName
                  }`}
                />
              );
            })}
          </Section>
        </div>

        <div className="space-y-8">
          {/* Activity */}
          <Section code="§02" title="Atividade recente" count={recentEvents.length}>
            <ul className="font-mono text-[11px] leading-relaxed text-ink-400">
              {recentEvents.map((e) => (
                <li key={e.id} className="border-b border-white/[0.04] py-2">
                  <div className="text-ink-500">
                    {new Date(e.createdAt).toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <span className="text-ink-200">{e.action}</span>
                    {e.fromStatus && e.toStatus && (
                      <span className="ml-2 text-ink-400">
                        {e.fromStatus} → {e.toStatus}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Reveal>
            <div className="rounded-md border border-white/[0.07] bg-ink-850/60 p-6">
              <TechLabel className="mb-3">Atalhos</TechLabel>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/explore">Explorar empresas →</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/d">Todos os deals →</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="justify-start">
                  <Link href="/c/edit">Editar empresa →</Link>
                </Button>
              </div>
              <div className="mt-4 border-t border-white/[0.05] pt-3">
                <TechLabel className="mb-1">Seu papel</TechLabel>
                <p className="text-xs text-ink-300">
                  {memberRoleLabel(session.user.companyRole as CompanyMemberRole | undefined)}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function Section({
  code,
  title,
  count,
  empty,
  children,
}: {
  code: string;
  title: string;
  count: number;
  empty?: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal>
      <section className="rounded-md border border-white/[0.07] bg-ink-850/60">
        <header className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="num-marker text-xs text-amber/80">{code}</span>
            <h2 className="display-md text-sm text-ink-100">{title}</h2>
          </div>
          <span className="num-marker text-xs text-ink-400">
            {String(count).padStart(2, '0')}
          </span>
        </header>
        <div className="px-5 py-3">
          {count === 0 ? (
            <p className="py-4 text-center text-xs text-ink-400">{empty}</p>
          ) : (
            <div className="divide-y divide-white/[0.04]">{children}</div>
          )}
        </div>
      </section>
    </Reveal>
  );
}

function Row({
  href,
  title,
  sub,
  meta,
}: {
  href: string;
  title: string;
  sub?: string;
  meta?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 py-3 transition-colors hover:bg-white/[0.02]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-100 transition-colors group-hover:text-amber-glow">
          {title}
        </p>
        {sub && <p className="mt-0.5 truncate text-xs text-ink-400">{sub}</p>}
      </div>
      {meta}
    </Link>
  );
}

function memberRoleLabel(role?: CompanyMemberRole) {
  switch (role) {
    case 'OWNER':
      return 'Você é proprietário(a) da empresa.';
    case 'COMMERCIAL':
      return 'Você atua no comercial da empresa.';
    case 'OPERATIONS':
      return 'Você atua na operação da empresa.';
    case 'FINANCE':
      return 'Você atua no financeiro da empresa.';
    default:
      return 'Membro da empresa.';
  }
}
