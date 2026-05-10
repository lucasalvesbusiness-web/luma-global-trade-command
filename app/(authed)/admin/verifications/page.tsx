import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { VerificationsAdminClient } from '@/components/admin/VerificationsAdminClient';

export default async function VerificationsAdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/admin/verifications');
  if (session.user.platformRole !== 'ADMIN') redirect('/');

  // All artifacts (filtered client-side by tab) — capped to recent 200.
  const items = await db.verificationArtifact.findMany({
    include: { company: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  return <VerificationsAdminClient initialItems={items} />;
}
