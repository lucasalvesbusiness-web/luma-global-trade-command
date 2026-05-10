import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { VerificationsAdminClient } from '@/components/admin/VerificationsAdminClient';

export default async function VerificationsAdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/admin/verifications');
  if (session.user.platformRole !== 'ADMIN') redirect('/');

  const pending = await repositories.verificationArtifact.listPending();
  return <VerificationsAdminClient initialItems={pending} />;
}
