import { notFound, redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { repositories } from '@/server/repositories';

import { BuyerProposalDetail } from '@/components/buyer/BuyerProposalDetail';

export const dynamic = 'force-dynamic';

export default async function BuyerProposalDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/sign-in');

  const buyer = await db.buyer.findUnique({
    where: { userId: session.user.id },
    select: { companyId: true },
  });
  if (!buyer) redirect('/auth/no-access');

  const { reference } = await params;
  const detail = await repositories.proposal.findByReference(reference);
  if (!detail || detail.buyerCompany.id !== buyer.companyId) {
    notFound();
  }

  return <BuyerProposalDetail detail={detail} />;
}
