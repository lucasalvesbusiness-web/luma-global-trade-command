import { notFound } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { CompanyProfileView } from '@/components/company/CompanyProfileView';

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await repositories.company.findBySlug(slug);
  if (!company) notFound();

  const session = await auth();
  const isOwner = session?.user?.companyId === company.id && session.user.companyRole === 'OWNER';

  return <CompanyProfileView company={company} isOwner={isOwner} />;
}
