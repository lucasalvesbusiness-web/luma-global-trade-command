import { notFound, redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { DealDetailClient } from '@/components/deal/DealDetailClient';

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/sign-in?callbackUrl=/d/${id}`);
  if (!session.user.companyId) redirect('/start');

  const deal = await repositories.dealRoom.findById(id);
  if (!deal) notFound();

  const isBuyer = deal.buyerCompanyId === session.user.companyId;
  const isSupplier = deal.supplierCompanyId === session.user.companyId;
  if (!isBuyer && !isSupplier) redirect('/d');

  const events = await repositories.dealRoom.listAuditEvents(id);

  return (
    <DealDetailClient
      deal={deal}
      viewerRole={isBuyer ? 'BUYER' : 'SUPPLIER'}
      events={events}
    />
  );
}
