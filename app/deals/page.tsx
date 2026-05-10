import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { DealListClient } from '@/components/deal/DealListClient';

export default async function DealsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/deals');
  if (!session.user.companyId) redirect('/onboarding');

  const deals = await repositories.dealRoom.listForCompany(session.user.companyId);
  const enriched = deals.map((d) => ({
    ...d,
    viewerRole:
      d.buyerCompanyId === session.user.companyId ? ('BUYER' as const) : ('SUPPLIER' as const),
  }));

  return <DealListClient deals={enriched} />;
}
