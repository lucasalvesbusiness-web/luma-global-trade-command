import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { repositories } from '@/server/repositories';

import { BuyerProposalsList } from '@/components/buyer/BuyerProposalsList';

export const dynamic = 'force-dynamic';

export default async function BuyerProposalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/sign-in?next=/buyer/proposals');

  const buyer = await db.buyer.findUnique({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  if (!buyer) redirect('/auth/no-access');

  const proposals = await repositories.proposal.list({
    companyIds: [buyer.companyId],
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <p className="text-[0.62rem] uppercase tracking-[0.38em] text-luma-olive/80">
          Suas propostas / Your proposals
        </p>
        <h2 className="mt-1 font-display text-3xl font-light text-luma-ink">
          {proposals.length === 0
            ? 'Você ainda não tem propostas'
            : `${proposals.length} ${proposals.length === 1 ? 'proposta' : 'propostas'}`}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-luma-ink/60">
          Acompanhe aqui o status de cada proposta enviada à Luma. Você
          recebe um e-mail a cada mudança de etapa. / Track each proposal
          submitted to Luma. You receive an email at every step change.
        </p>
      </header>
      <BuyerProposalsList proposals={proposals} />
    </main>
  );
}
