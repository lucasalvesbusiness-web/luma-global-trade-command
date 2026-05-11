import type { PrismaClient } from '@prisma/client';

import { db } from '@/lib/db';

export type TicketBand = 'UNDER_5K' | '5K_25K' | '25K_100K' | '100K_500K' | 'OVER_500K';

export const TICKET_BAND_LABELS: Record<TicketBand, string> = {
  UNDER_5K: '< 5k',
  '5K_25K': '5k–25k',
  '25K_100K': '25k–100k',
  '100K_500K': '100k–500k',
  OVER_500K: '> 500k',
};

export function ticketBandFromCents(cents: number | null | undefined): TicketBand | null {
  if (cents === null || cents === undefined) return null;
  const v = cents / 100;
  if (v < 5_000) return 'UNDER_5K';
  if (v < 25_000) return '5K_25K';
  if (v < 100_000) return '25K_100K';
  if (v < 500_000) return '100K_500K';
  return 'OVER_500K';
}

export type ContextualBreakdown<K extends string> = Array<{
  key: K;
  deals: number;
  avgRating: number | null;
  reviewCount: number;
}>;

export type ReputationSignals = {
  confirmedDealsCount: number;
  disputedCount: number;
  cancelledCount: number;
  disputeRate: number; // 0..1, undefined if no deals
  avgRating: number | null; // null until at least one submitted review
  totalReviews: number;
  recurringClientsCount: number; // distinct counterparties with >= 2 confirmed deals
  topCategories: Array<{ category: string; deals: number }>;
  // Contextual breakdowns
  reputationByCategory: ContextualBreakdown<string>;
  reputationByTicketBand: ContextualBreakdown<TicketBand>;
  reputationByCounterpartySize: ContextualBreakdown<string>;
  avgCycleDays: number | null;
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
      quoteCents: true,
      openedAt: true,
      confirmedAt: true,
      buyerCompany: { select: { companySize: true } },
      supplierCompany: { select: { companySize: true } },
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
    select: { rating: true, category: true, dealRoomId: true },
  });
  const dealById = new Map(deals.map((d) => [d.id, d]));
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

  // ── Contextual breakdowns ─────────────────────────────────────

  type Agg = { deals: number; ratingSum: number; reviewCount: number };
  function ensure<K extends string>(map: Map<K, Agg>, key: K): Agg {
    let a = map.get(key);
    if (!a) {
      a = { deals: 0, ratingSum: 0, reviewCount: 0 };
      map.set(key, a);
    }
    return a;
  }
  function toList<K extends string>(map: Map<K, Agg>): ContextualBreakdown<K> {
    return Array.from(map.entries())
      .map(([key, a]) => ({
        key,
        deals: a.deals,
        avgRating: a.reviewCount > 0 ? a.ratingSum / a.reviewCount : null,
        reviewCount: a.reviewCount,
      }))
      .sort((x, y) => y.deals - x.deals || (y.avgRating ?? 0) - (x.avgRating ?? 0));
  }

  const byTicket = new Map<TicketBand, Agg>();
  const byCpSize = new Map<string, Agg>();
  for (const d of deals) {
    if (d.status !== 'CONFIRMED' && d.status !== 'CLOSED') continue;
    const band = ticketBandFromCents(d.quoteCents);
    if (band) ensure(byTicket, band).deals += 1;
    const cpSize =
      d.buyerCompanyId === companyId
        ? d.supplierCompany?.companySize
        : d.buyerCompany?.companySize;
    if (cpSize) ensure(byCpSize, cpSize).deals += 1;
  }

  const byCategory = new Map<string, Agg>();
  for (const r of reviews) {
    const dr = dealById.get(r.dealRoomId);
    if (r.category) {
      const a = ensure(byCategory, r.category);
      a.ratingSum += r.rating ?? 0;
      a.reviewCount += 1;
    }
    if (!dr) continue;
    const band = ticketBandFromCents(dr.quoteCents);
    if (band) {
      const a = ensure(byTicket, band);
      a.ratingSum += r.rating ?? 0;
      a.reviewCount += 1;
    }
    const cpSize =
      dr.buyerCompanyId === companyId
        ? dr.supplierCompany?.companySize
        : dr.buyerCompany?.companySize;
    if (cpSize) {
      const a = ensure(byCpSize, cpSize);
      a.ratingSum += r.rating ?? 0;
      a.reviewCount += 1;
    }
  }

  // Backfill "deals" for category from offerings catalog if missing.
  for (const [cat, count] of categoryCount) {
    const a = ensure(byCategory, cat);
    a.deals = Math.max(a.deals, count);
  }

  // avg cycle days (confirmedAt - openedAt) over confirmed/closed deals
  const cycleDurations: number[] = [];
  for (const d of deals) {
    if (d.status !== 'CONFIRMED' && d.status !== 'CLOSED') continue;
    if (!d.confirmedAt) continue;
    const ms = d.confirmedAt.getTime() - d.openedAt.getTime();
    if (ms > 0) cycleDurations.push(ms / (1000 * 60 * 60 * 24));
  }
  const avgCycleDays =
    cycleDurations.length === 0
      ? null
      : cycleDurations.reduce((s, n) => s + n, 0) / cycleDurations.length;

  return {
    confirmedDealsCount,
    disputedCount,
    cancelledCount,
    disputeRate,
    avgRating,
    totalReviews,
    recurringClientsCount,
    topCategories,
    reputationByCategory: toList(byCategory),
    reputationByTicketBand: toList(byTicket),
    reputationByCounterpartySize: toList(byCpSize),
    avgCycleDays,
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
