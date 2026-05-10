import { z } from 'zod';

import { db } from '@/lib/db';
import { protectedProcedure, router } from '@/server/trpc/trpc';

export type HomeSelf = {
  companyId: string;
  slug: string;
  name: string;
  legalName: string;
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
  verificationStatus: string;
  heroImageUrl: string | null;
};

export type HomeCompany = {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  verificationStatus: string;
  heroImageUrl: string | null;
  categories: string[];
  isWatched: boolean;
  hasConfirmedDeal: boolean;
  isConnected: boolean;
  confirmedDealsCount: number;
  avgRating: number | null;
  distanceKm: number;
};

export type HomeFeed =
  | { reason: 'no-company'; self: null; companies: [] }
  | { reason: 'no-coords'; self: null; companies: [] }
  | { reason: 'ok'; self: HomeSelf; companies: HomeCompany[] };

const MAX_LIMIT = 50;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const homeRouter = router({
  nearbyCompanies: protectedProcedure
    .input(
      z.object({
        radiusKm: z.number().positive().max(2000).default(5),
        limit: z.number().int().positive().max(MAX_LIMIT).optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<HomeFeed> => {
      if (!ctx.user.companyId) {
        return { reason: 'no-company', self: null, companies: [] };
      }

      const me = await db.company.findUnique({
        where: { id: ctx.user.companyId },
        select: {
          id: true,
          slug: true,
          legalName: true,
          tradeName: true,
          latitude: true,
          longitude: true,
          city: true,
          state: true,
          verificationStatus: true,
          heroImageUrl: true,
        },
      });

      if (!me || me.latitude === null || me.longitude === null) {
        return { reason: 'no-coords', self: null, companies: [] };
      }

      const selfLat = Number(me.latitude);
      const selfLng = Number(me.longitude);

      // Pre-filter candidates by lat/lng bounding box (cheap), then exact
      // Haversine. Limits to 500 raw to keep this O(n) work tiny.
      // 1° lat ≈ 111km; 1° lng varies with lat — use 111 * cos(lat) as approx.
      const latDelta = input.radiusKm / 111;
      const lngDelta = input.radiusKm / (111 * Math.cos((selfLat * Math.PI) / 180));

      const candidates = await db.company.findMany({
        where: {
          id: { not: me.id },
          latitude: { gte: selfLat - latDelta, lte: selfLat + latDelta },
          longitude: { gte: selfLng - lngDelta, lte: selfLng + lngDelta },
        },
        include: { offerings: { select: { category: true } } },
        take: 500,
      });

      const within = candidates
        .map((c) => {
          const lat = Number(c.latitude);
          const lng = Number(c.longitude);
          return { c, lat, lng, distanceKm: haversineKm(selfLat, selfLng, lat, lng) };
        })
        .filter((row) => row.distanceKm <= input.radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, input.limit ?? MAX_LIMIT);

      if (within.length === 0) {
        return {
          reason: 'ok',
          self: {
            companyId: me.id,
            slug: me.slug,
            name: me.tradeName ?? me.legalName,
            legalName: me.legalName,
            lat: selfLat,
            lng: selfLng,
            city: me.city,
            state: me.state,
            verificationStatus: me.verificationStatus,
            heroImageUrl: me.heroImageUrl,
          },
          companies: [],
        };
      }

      const candidateIds = within.map((r) => r.c.id);

      const [watches, confirmedDeals, reputations] = await Promise.all([
        db.companyWatch.findMany({
          where: {
            OR: [
              {
                watcherCompanyId: me.id,
                watchedCompanyId: { in: candidateIds },
              },
              {
                watcherCompanyId: { in: candidateIds },
                watchedCompanyId: me.id,
              },
            ],
          },
          select: { watcherCompanyId: true, watchedCompanyId: true },
        }),
        db.dealRoom.findMany({
          where: {
            status: { in: ['CONFIRMED', 'CLOSED'] },
            OR: [
              { buyerCompanyId: me.id, supplierCompanyId: { in: candidateIds } },
              { supplierCompanyId: me.id, buyerCompanyId: { in: candidateIds } },
            ],
          },
          select: { buyerCompanyId: true, supplierCompanyId: true },
        }),
        db.review.groupBy({
          by: ['ratedCompanyId'],
          where: {
            ratedCompanyId: { in: candidateIds },
            rating: { not: null },
            submittedAt: { not: null },
          },
          _avg: { rating: true },
          _count: { _all: true },
        }),
      ]);

      const watchedIds = new Set<string>();
      for (const w of watches) {
        if (w.watcherCompanyId === me.id) watchedIds.add(w.watchedCompanyId);
        else watchedIds.add(w.watcherCompanyId);
      }

      const dealIds = new Set<string>();
      for (const d of confirmedDeals) {
        if (d.buyerCompanyId === me.id) dealIds.add(d.supplierCompanyId);
        else dealIds.add(d.buyerCompanyId);
      }

      const dealCountById = new Map<string, number>();
      for (const d of confirmedDeals) {
        const otherId = d.buyerCompanyId === me.id ? d.supplierCompanyId : d.buyerCompanyId;
        dealCountById.set(otherId, (dealCountById.get(otherId) ?? 0) + 1);
      }

      const repById = new Map<string, { avg: number | null; count: number }>();
      for (const r of reputations) {
        repById.set(r.ratedCompanyId, {
          avg: r._avg.rating ?? null,
          count: r._count._all,
        });
      }

      const companies: HomeCompany[] = within.map(({ c, lat, lng, distanceKm }) => {
        const isWatched = watchedIds.has(c.id);
        const hasConfirmedDeal = dealIds.has(c.id);
        const rep = repById.get(c.id);
        const cats = Array.from(new Set(c.offerings.map((o) => o.category))).slice(0, 3);
        return {
          id: c.id,
          slug: c.slug,
          name: c.tradeName ?? c.legalName,
          legalName: c.legalName,
          city: c.city,
          state: c.state,
          lat,
          lng,
          verificationStatus: c.verificationStatus,
          heroImageUrl: c.heroImageUrl,
          categories: cats,
          isWatched,
          hasConfirmedDeal,
          isConnected: isWatched || hasConfirmedDeal,
          confirmedDealsCount: dealCountById.get(c.id) ?? 0,
          avgRating: rep?.avg ?? null,
          distanceKm: Math.round(distanceKm * 100) / 100,
        };
      });

      return {
        reason: 'ok',
        self: {
          companyId: me.id,
          slug: me.slug,
          name: me.tradeName ?? me.legalName,
          legalName: me.legalName,
          lat: selfLat,
          lng: selfLng,
          city: me.city,
          state: me.state,
          verificationStatus: me.verificationStatus,
          heroImageUrl: me.heroImageUrl,
        },
        companies,
      };
    }),
});
