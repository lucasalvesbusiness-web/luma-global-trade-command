import { z } from 'zod';

import { db } from '@/lib/db';
import { computeReputation } from '@/server/services/reputation';
import { publicProcedure, router } from '@/server/trpc/trpc';

const verificationOrder: Record<string, number> = {
  UNVERIFIED: 0,
  EMAIL_VERIFIED: 1,
  DOC_VERIFIED: 2,
};

export type DiscoverySearchInput = {
  query?: string;
  categories?: string[];
  subcategories?: string[];
  modalities?: Array<'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'>;
  minVerification?: 'UNVERIFIED' | 'EMAIL_VERIFIED' | 'DOC_VERIFIED';
  companySizes?: Array<'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE'>;
  deliveryModes?: Array<'LOCAL' | 'REMOTE' | 'HYBRID'>;
  targetSegments?: Array<
    'SMB' | 'MID_MARKET' | 'ENTERPRISE' | 'GOVERNMENT' | 'CONSUMER_RETAIL'
  >;
  minConfirmedDeals?: number;
  hasEvidence?: boolean;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  limit?: number;
};

export type DiscoveryResult = {
  id: string;
  slug: string;
  legalName: string;
  tradeName: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
  verificationStatus: string;
  companySize: string | null;
  deliveryMode: string | null;
  targetSegments: string[];
  distanceKm: number | null;
  categories: string[];
  subcategories: string[];
  modalities: string[];
  confirmedDealsCount: number;
  avgRating: number | null;
  hasEvidence: boolean;
};

export const discoveryRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().max(120).optional(),
        categories: z.array(z.string()).max(10).optional(),
        subcategories: z.array(z.string()).max(20).optional(),
        modalities: z
          .array(z.enum(['ONE_OFF', 'RECURRING', 'PRODUCT_SUPPLY']))
          .max(3)
          .optional(),
        minVerification: z
          .enum(['UNVERIFIED', 'EMAIL_VERIFIED', 'DOC_VERIFIED'])
          .optional(),
        companySizes: z
          .array(z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']))
          .max(4)
          .optional(),
        deliveryModes: z
          .array(z.enum(['LOCAL', 'REMOTE', 'HYBRID']))
          .max(3)
          .optional(),
        targetSegments: z
          .array(
            z.enum([
              'SMB',
              'MID_MARKET',
              'ENTERPRISE',
              'GOVERNMENT',
              'CONSUMER_RETAIL',
            ]),
          )
          .max(5)
          .optional(),
        minConfirmedDeals: z.number().int().min(0).max(1000).optional(),
        hasEvidence: z.boolean().optional(),
        centerLat: z.number().min(-90).max(90).optional(),
        centerLng: z.number().min(-180).max(180).optional(),
        radiusKm: z.number().int().positive().max(2000).optional(),
        limit: z.number().int().positive().max(100).optional(),
      }),
    )
    .query(async ({ input }): Promise<DiscoveryResult[]> => {
      const limit = input.limit ?? 50;
      const minVerifLevel = verificationOrder[input.minVerification ?? 'UNVERIFIED'] ?? 0;

      const hasGeo =
        input.centerLat !== undefined &&
        input.centerLng !== undefined &&
        input.radiusKm !== undefined;

      // Pull companies + offerings; filter geo + verification in JS for portability.
      // For MVP scale (< 10k companies) this is fine. F4+ moves to PostGIS ST_DWithin.
      const companies = await db.company.findMany({
        where: {
          ...(input.query
            ? {
                // SQLite's LIKE is case-insensitive by default; Postgres needs
                // mode: 'insensitive'. We omit mode for portability.
                OR: [
                  { legalName: { contains: input.query } },
                  { tradeName: { contains: input.query } },
                  { description: { contains: input.query } },
                ],
              }
            : {}),
          ...(input.categories && input.categories.length > 0
            ? { offerings: { some: { category: { in: input.categories } } } }
            : {}),
          ...(input.subcategories && input.subcategories.length > 0
            ? { offerings: { some: { subcategory: { in: input.subcategories } } } }
            : {}),
          ...(input.modalities && input.modalities.length > 0
            ? { offerings: { some: { modality: { in: input.modalities } } } }
            : {}),
          ...(input.companySizes && input.companySizes.length > 0
            ? { companySize: { in: input.companySizes } }
            : {}),
          ...(input.deliveryModes && input.deliveryModes.length > 0
            ? { deliveryMode: { in: input.deliveryModes } }
            : {}),
          ...(input.hasEvidence
            ? { artifacts: { some: { status: 'APPROVED' } } }
            : {}),
        },
        include: {
          offerings: true,
          _count: { select: { artifacts: { where: { status: 'APPROVED' } } } },
        },
        take: 500,
      });

      const filtered = companies
        .map((c) => {
          const lat = c.latitude ? Number(c.latitude) : null;
          const lng = c.longitude ? Number(c.longitude) : null;
          let distanceKm: number | null = null;
          if (hasGeo && lat !== null && lng !== null) {
            distanceKm = haversineKm(input.centerLat!, input.centerLng!, lat, lng);
          }
          return { c, lat, lng, distanceKm };
        })
        .filter(({ c, distanceKm }) => {
          if ((verificationOrder[c.verificationStatus] ?? 0) < minVerifLevel) return false;
          if (hasGeo) {
            if (distanceKm === null) return false;
            if (distanceKm > input.radiusKm!) return false;
          }
          if (input.targetSegments && input.targetSegments.length > 0) {
            const segs = parseSegments(c.targetSegments);
            if (!input.targetSegments.some((s) => segs.includes(s))) return false;
          }
          return true;
        });

      // Hydrate reputation in parallel for the candidate set (capped to limit*2
      // pre-sort to avoid extra computation).
      const candidates = filtered.slice(0, limit * 2);
      const reputations = await Promise.all(
        candidates.map(({ c }) => computeReputation(c.id)),
      );
      const enriched = candidates
        .map((row, idx) => ({ ...row, reputation: reputations[idx]! }))
        .filter(({ reputation }) =>
          input.minConfirmedDeals === undefined
            ? true
            : reputation.confirmedDealsCount >= input.minConfirmedDeals,
        );

      enriched.sort((a, b) => {
        const va = verificationOrder[a.c.verificationStatus] ?? 0;
        const vb = verificationOrder[b.c.verificationStatus] ?? 0;
        if (va !== vb) return vb - va; // higher verification first
        if (a.reputation.confirmedDealsCount !== b.reputation.confirmedDealsCount) {
          return b.reputation.confirmedDealsCount - a.reputation.confirmedDealsCount;
        }
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return a.c.legalName.localeCompare(b.c.legalName);
      });

      return enriched
        .slice(0, limit)
        .map<DiscoveryResult>(({ c, lat, lng, distanceKm, reputation }) => ({
          id: c.id,
          slug: c.slug,
          legalName: c.legalName,
          tradeName: c.tradeName,
          description: c.description,
          city: c.city,
          state: c.state,
          latitude: lat,
          longitude: lng,
          serviceRadiusKm: c.serviceRadiusKm,
          verificationStatus: c.verificationStatus,
          companySize: c.companySize,
          deliveryMode: c.deliveryMode,
          targetSegments: parseSegments(c.targetSegments),
          distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
          categories: Array.from(new Set(c.offerings.map((o) => o.category))),
          subcategories: Array.from(
            new Set(
              c.offerings
                .map((o) => o.subcategory)
                .filter((s): s is string => Boolean(s)),
            ),
          ),
          modalities: Array.from(new Set(c.offerings.map((o) => o.modality))),
          confirmedDealsCount: reputation.confirmedDealsCount,
          avgRating: reputation.avgRating,
          hasEvidence: (c._count?.artifacts ?? 0) > 0,
        }));
    }),
});

function parseSegments(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === 'string')
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
