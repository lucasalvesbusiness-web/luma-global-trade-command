import { notFound } from 'next/navigation';

import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import type { Counterparty } from '@/components/canvas/ProfileNetworkCanvas';
import { repositories } from '@/server/repositories';
import { computeReputation } from '@/server/services/reputation';
import { CompanyProfileView } from '@/components/company/CompanyProfileView';

type DealHistoryRow = {
  id: string;
  template: string;
  status: string;
  buyerCompanyId: string;
  supplierCompanyId: string;
  confirmedAt: Date | null;
  closedAt: Date | null;
  counterparty: { slug: string; legalName: string; tradeName: string | null };
};

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await repositories.company.findBySlug(slug);
  if (!company) notFound();

  const [session, reputation, dealsRaw] = await Promise.all([
    auth(),
    computeReputation(company.id),
    db.dealRoom.findMany({
      where: {
        OR: [{ buyerCompanyId: company.id }, { supplierCompanyId: company.id }],
        status: { in: ['CONFIRMED', 'CLOSED'] },
      },
      include: {
        buyerCompany: { select: { slug: true, legalName: true, tradeName: true } },
        supplierCompany: { select: { slug: true, legalName: true, tradeName: true } },
      },
      orderBy: [{ confirmedAt: 'desc' }, { closedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 30,
    }),
  ]);

  const isOwner =
    session?.user?.companyId === company.id && session.user.companyRole === 'OWNER';
  const canOpenDeal =
    !!session?.user?.companyId &&
    session.user.companyId !== company.id &&
    company.offerings.length > 0;
  const canWatch =
    !!session?.user?.companyId && session.user.companyId !== company.id;

  const counterMap = new Map<string, Counterparty>();
  const dealHistory: DealHistoryRow[] = [];
  for (const d of dealsRaw) {
    const isBuyer = d.buyerCompanyId === company.id;
    const cpData = isBuyer ? d.supplierCompany : d.buyerCompany;
    const cpId = isBuyer ? d.supplierCompanyId : d.buyerCompanyId;
    const existing = counterMap.get(cpId);
    if (existing) {
      existing.weight += 1;
    } else {
      counterMap.set(cpId, {
        id: cpId,
        slug: cpData.slug,
        name: cpData.tradeName ?? cpData.legalName,
        weight: 1,
      });
    }
    dealHistory.push({
      id: d.id,
      template: d.template,
      status: d.status,
      buyerCompanyId: d.buyerCompanyId,
      supplierCompanyId: d.supplierCompanyId,
      confirmedAt: d.confirmedAt,
      closedAt: d.closedAt,
      counterparty: cpData,
    });
  }

  const counterparties = Array.from(counterMap.values()).sort((a, b) => b.weight - a.weight);

  return (
    <CompanyProfileView
      company={company}
      isOwner={isOwner}
      canOpenDeal={canOpenDeal}
      canWatch={canWatch}
      reputation={reputation}
      counterparties={counterparties}
      dealHistory={dealHistory}
      isAuthenticated={!!session?.user}
    />
  );
}
