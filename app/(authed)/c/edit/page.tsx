import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { repositories } from '@/server/repositories';
import { CompanyEditClient } from '@/components/company/CompanyEditClient';

export default async function CompanyEditPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/c/edit');
  if (session.user.companyRole !== 'OWNER' || !session.user.companyId) {
    redirect('/');
  }

  const [company, artifacts] = await Promise.all([
    repositories.company.findById(session.user.companyId),
    db.verificationArtifact.findMany({
      where: { companyId: session.user.companyId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  if (!company) redirect('/');

  return <CompanyEditClient company={company} artifacts={artifacts} />;
}
