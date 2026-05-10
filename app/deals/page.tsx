import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { repositories } from '@/server/repositories';
import { DealListClient } from '@/components/deal/DealListClient';

export default async function DealsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/deals');
  if (!session.user.companyId) redirect('/onboarding');

  const [deals, pendingReviewsCount] = await Promise.all([
    repositories.dealRoom.listForCompany(session.user.companyId),
    db.review.count({
      where: { raterCompanyId: session.user.companyId, submittedAt: null },
    }),
  ]);

  const enriched = deals.map((d) => ({
    ...d,
    viewerRole:
      d.buyerCompanyId === session.user.companyId ? ('BUYER' as const) : ('SUPPLIER' as const),
  }));

  return <DealListClient deals={enriched} pendingReviewsCount={pendingReviewsCount} />;
}
