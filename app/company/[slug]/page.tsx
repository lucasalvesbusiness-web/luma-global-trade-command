import { notFound } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';
import { computeReputation } from '@/server/services/reputation';
import { CompanyProfileView } from '@/components/company/CompanyProfileView';

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await repositories.company.findBySlug(slug);
  if (!company) notFound();

  const [session, reputation] = await Promise.all([auth(), computeReputation(company.id)]);
  const isOwner =
    session?.user?.companyId === company.id && session.user.companyRole === 'OWNER';
  const canOpenDeal =
    !!session?.user?.companyId &&
    session.user.companyId !== company.id &&
    company.offerings.length > 0;

  return (
    <CompanyProfileView
      company={company}
      isOwner={isOwner}
      canOpenDeal={canOpenDeal}
      reputation={reputation}
    />
  );
}
