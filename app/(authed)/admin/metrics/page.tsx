import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { MetricsAdminClient } from '@/components/admin/MetricsAdminClient';

export const dynamic = 'force-dynamic';

export default async function MetricsAdminPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/admin/metrics');
  if (session.user.platformRole !== 'ADMIN') redirect('/');

  return <MetricsAdminClient />;
}
