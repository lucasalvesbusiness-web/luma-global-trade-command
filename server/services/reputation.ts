import type { PrismaClient } from '@prisma/client';

import { db } from '@/lib/db';

export type ReputationSignals = {
  confirmedDealsCount: number;
  disputedCount: number;
  cancelledCount: number;
  disputeRate: number; // 0..1, undefined if no deals
  avgRating: number | null; // null until at least one submitted review
  totalReviews: number;
  recurringClientsCount: number; // distinct counterparties with >= 2 confirmed deals
  topCategories: Array<{ category: string; deals: number }>;
};

export async function computeReputation(
  companyId: string,
  prisma: PrismaClient = db,
): Promise<ReputationSignals> {
  const deals = await prisma.dealRoom.findMany({
    where: {
      OR: [{ buyerCompanyId: companyId }, { supplierCompanyId: companyId }],
      status: { in: ['CONFIRMED', 'CLOSED', 'DISPUTED', 'CANCELLED'] },
    },
    select: {
      id: true,
      status: true,
      buyerCompanyId: true,
      supplierCompanyId: true,
    },
  });

  const totalRelevant = deals.length;
  const confirmedDealsCount = deals.filter(
    (d) => d.status === 'CONFIRMED' || d.status === 'CLOSED',
  ).length;
  const disputedCount = deals.filter((d) => d.status === 'DISPUTED').length;
  const cancelledCount = deals.filter((d) => d.status === 'CANCELLED').length;
  const disputeRate = totalRelevant > 0 ? disputedCount / totalRelevant : 0;

  // Recurring clients: distinct counterparties with >= 2 confirmed deals.
  const counterpartyConfirmed = new Map<string, number>();
  for (const d of deals) {
    if (d.status !== 'CONFIRMED' && d.status !== 'CLOSED') continue;
    const cp = d.buyerCompanyId === companyId ? d.supplierCompanyId : d.buyerCompanyId;
    counterpartyConfirmed.set(cp, (counterpartyConfirmed.get(cp) ?? 0) + 1);
  }
  const recurringClientsCount = Array.from(counterpartyConfirmed.values()).filter(
    (n) => n >= 2,
  ).length;

  const reviews = await prisma.review.findMany({
    where: { ratedCompanyId: companyId, rating: { not: null }, submittedAt: { not: null } },
    select: { rating: true, category: true },
  });
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews === 0
      ? null
      : reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews;

  // Top categories by confirmed deals (joined to supplier offerings).
  // For MVP simplicity we surface the rated company's offerings as category
  // hints rather than computing per-deal category.
  const offerings = await prisma.serviceOffering.findMany({
    where: { companyId },
    select: { category: true },
  });
  const categoryCount = new Map<string, number>();
  for (const o of offerings) {
    categoryCount.set(o.category, (categoryCount.get(o.category) ?? 0) + 1);
  }
  const topCategories = Array.from(categoryCount.entries())
    .map(([category, deals]) => ({ category, deals }))
    .sort((a, b) => b.deals - a.deals)
    .slice(0, 5);

  return {
    confirmedDealsCount,
    disputedCount,
    cancelledCount,
    disputeRate,
    avgRating,
    totalReviews,
    recurringClientsCount,
    topCategories,
  };
}

/**
 * On DealRoom transition to CONFIRMED, create two empty Review rows so
 * each side can be prompted to rate. Idempotent via composite unique
 * (dealRoomId, raterCompanyId).
 */
export async function ensureReviewsForConfirmedDeal(
  dealRoomId: string,
  prisma: PrismaClient = db,
) {
  const dr = await prisma.dealRoom.findUnique({
    where: { id: dealRoomId },
    select: {
      id: true,
      status: true,
      buyerCompanyId: true,
      supplierCompanyId: true,
    },
  });
  if (!dr) return;
  if (dr.status !== 'CONFIRMED' && dr.status !== 'CLOSED') return;

  await Promise.all([
    prisma.review.upsert({
      where: {
        dealRoomId_raterCompanyId: {
          dealRoomId: dr.id,
          raterCompanyId: dr.buyerCompanyId,
        },
      },
      create: {
        dealRoomId: dr.id,
        raterCompanyId: dr.buyerCompanyId,
        ratedCompanyId: dr.supplierCompanyId,
      },
      update: {},
    }),
    prisma.review.upsert({
      where: {
        dealRoomId_raterCompanyId: {
          dealRoomId: dr.id,
          raterCompanyId: dr.supplierCompanyId,
        },
      },
      create: {
        dealRoomId: dr.id,
        raterCompanyId: dr.supplierCompanyId,
        ratedCompanyId: dr.buyerCompanyId,
      },
      update: {},
    }),
  ]);
}
