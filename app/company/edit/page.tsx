import { redirect } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { CompanyEditClient } from '@/components/company/CompanyEditClient';

export default async function CompanyEditPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/sign-in?callbackUrl=/company/edit');
  if (session.user.companyRole !== 'OWNER' || !session.user.companyId) {
    redirect('/');
  }

  const company = await repositories.company.findById(session.user.companyId);
  if (!company) redirect('/');

  return <CompanyEditClient company={company} />;
}
