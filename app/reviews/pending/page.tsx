import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { PendingReviewsClient } from '@/components/review/PendingReviewsClient';

export default async function PendingReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/reviews/pending');
  if (!session.user.companyId) redirect('/onboarding');

  const reviews = await db.review.findMany({
    where: { raterCompanyId: session.user.companyId, submittedAt: null },
    include: {
      ratedCompany: { select: { slug: true, legalName: true, tradeName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const dealIds = reviews.map((r) => r.dealRoomId);
  const deals = await db.dealRoom.findMany({
    where: { id: { in: dealIds } },
    select: { id: true, title: true, template: true },
  });
  const dealById = new Map(deals.map((d) => [d.id, d]));

  const items = reviews.map((r) => ({
    id: r.id,
    dealId: r.dealRoomId,
    dealTitle: dealById.get(r.dealRoomId)?.title ?? '—',
    ratedCompany: r.ratedCompany,
  }));

  return <PendingReviewsClient items={items} />;
}
