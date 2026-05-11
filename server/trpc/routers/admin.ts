import { db } from '@/lib/db';
import { adminProcedure, router } from '@/server/trpc/trpc';

export type AdminMetrics = {
  generatedAt: string;
  companies: {
    total: number;
    verified: number;
    docVerified: number;
    withGeo: number;
    withOfferings: number;
    bySize: Array<{ key: string; count: number }>;
    byDeliveryMode: Array<{ key: string; count: number }>;
    byState: Array<{ key: string; count: number }>;
  };
  users: { total: number; admins: number };
  deals: {
    total: number;
    byStatus: Array<{ key: string; count: number }>;
    avgQuoteCents: number | null;
    confirmedLast30: number;
  };
  reviews: { total: number; submitted: number; avgRating: number | null };
  network: { watches: number; invitationsSent: number; invitationsAccepted: number };
  activity: { last7Days: number; last30Days: number };
  funnel: {
    opened: number;
    accepted: number;
    inProgress: number;
    delivered: number;
    confirmed: number;
    closed: number;
  };
};

export const adminRouter = router({
  metrics: adminProcedure.query(async (): Promise<AdminMetrics> => {
    const now = new Date();
    const t7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const t30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      companies,
      verifiedCount,
      docVerifiedCount,
      geoCount,
      offeringsCount,
      bySize,
      byDelivery,
      byState,
      userTotal,
      adminCount,
      dealTotal,
      byStatus,
      avgQuote,
      confirmedLast30,
      reviewTotal,
      reviewSubmittedAgg,
      watches,
      invSent,
      invAccepted,
      activity7,
      activity30,
    ] = await Promise.all([
      db.company.count(),
      db.company.count({ where: { verificationStatus: { in: ['EMAIL_VERIFIED', 'DOC_VERIFIED'] } } }),
      db.company.count({ where: { verificationStatus: 'DOC_VERIFIED' } }),
      db.company.count({ where: { latitude: { not: null }, longitude: { not: null } } }),
      db.company.count({ where: { offerings: { some: {} } } }),
      db.company.groupBy({ by: ['companySize'], _count: { _all: true } }),
      db.company.groupBy({ by: ['deliveryMode'], _count: { _all: true } }),
      db.company.groupBy({ by: ['state'], _count: { _all: true } }),
      db.user.count(),
      db.user.count({ where: { role: 'ADMIN' } }),
      db.dealRoom.count(),
      db.dealRoom.groupBy({ by: ['status'], _count: { _all: true } }),
      db.dealRoom.aggregate({ _avg: { quoteCents: true } }),
      db.dealRoom.count({
        where: { confirmedAt: { gte: t30 }, status: { in: ['CONFIRMED', 'CLOSED'] } },
      }),
      db.review.count(),
      db.review.aggregate({
        where: { rating: { not: null }, submittedAt: { not: null } },
        _count: { _all: true },
        _avg: { rating: true },
      }),
      db.companyWatch.count(),
      db.companyInvitation.count(),
      db.companyInvitation.count({ where: { acceptedAt: { not: null } } }),
      db.activityEvent.count({ where: { createdAt: { gte: t7 } } }),
      db.activityEvent.count({ where: { createdAt: { gte: t30 } } }),
    ]);

    const statusMap = new Map(byStatus.map((r) => [r.status, r._count._all]));
    const funnel = {
      opened: companies > 0 ? dealTotal : 0,
      accepted: (statusMap.get('ACCEPTED') ?? 0) + (statusMap.get('IN_PROGRESS') ?? 0)
        + (statusMap.get('DELIVERED') ?? 0) + (statusMap.get('CONFIRMED') ?? 0)
        + (statusMap.get('CLOSED') ?? 0),
      inProgress: (statusMap.get('IN_PROGRESS') ?? 0) + (statusMap.get('DELIVERED') ?? 0)
        + (statusMap.get('CONFIRMED') ?? 0) + (statusMap.get('CLOSED') ?? 0),
      delivered: (statusMap.get('DELIVERED') ?? 0) + (statusMap.get('CONFIRMED') ?? 0)
        + (statusMap.get('CLOSED') ?? 0),
      confirmed: (statusMap.get('CONFIRMED') ?? 0) + (statusMap.get('CLOSED') ?? 0),
      closed: statusMap.get('CLOSED') ?? 0,
    };

    return {
      generatedAt: now.toISOString(),
      companies: {
        total: companies,
        verified: verifiedCount,
        docVerified: docVerifiedCount,
        withGeo: geoCount,
        withOfferings: offeringsCount,
        bySize: bySize.map((r) => ({ key: r.companySize ?? '—', count: r._count._all })),
        byDeliveryMode: byDelivery.map((r) => ({
          key: r.deliveryMode ?? '—',
          count: r._count._all,
        })),
        byState: byState
          .map((r) => ({ key: r.state ?? '—', count: r._count._all }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      },
      users: { total: userTotal, admins: adminCount },
      deals: {
        total: dealTotal,
        byStatus: byStatus.map((r) => ({ key: r.status, count: r._count._all })),
        avgQuoteCents: avgQuote._avg.quoteCents,
        confirmedLast30,
      },
      reviews: {
        total: reviewTotal,
        submitted: reviewSubmittedAgg._count._all,
        avgRating: reviewSubmittedAgg._avg.rating,
      },
      network: {
        watches,
        invitationsSent: invSent,
        invitationsAccepted: invAccepted,
      },
      activity: { last7Days: activity7, last30Days: activity30 },
      funnel,
    };
  }),
});
