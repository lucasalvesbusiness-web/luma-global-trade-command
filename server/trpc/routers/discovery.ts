import { z } from 'zod';

import { db } from '@/lib/db';
import { publicProcedure, router } from '@/server/trpc/trpc';

const verificationOrder: Record<string, number> = {
  UNVERIFIED: 0,
  EMAIL_VERIFIED: 1,
  DOC_VERIFIED: 2,
};

export type DiscoverySearchInput = {
  query?: string;
  categories?: string[];
  modalities?: Array<'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'>;
  minVerification?: 'UNVERIFIED' | 'EMAIL_VERIFIED' | 'DOC_VERIFIED';
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
  distanceKm: number | null;
  categories: string[];
  modalities: string[];
};

export const discoveryRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().max(120).optional(),
        categories: z.array(z.string()).max(10).optional(),
        modalities: z
          .array(z.enum(['ONE_OFF', 'RECURRING', 'PRODUCT_SUPPLY']))
          .max(3)
          .optional(),
        minVerification: z
          .enum(['UNVERIFIED', 'EMAIL_VERIFIED', 'DOC_VERIFIED'])
          .optional(),
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
                OR: [
                  { legalName: { contains: input.query, mode: 'insensitive' } },
                  { tradeName: { contains: input.query, mode: 'insensitive' } },
                  { description: { contains: input.query, mode: 'insensitive' } },
                ],
              }
            : {}),
          ...(input.categories && input.categories.length > 0
            ? { offerings: { some: { category: { in: input.categories } } } }
            : {}),
          ...(input.modalities && input.modalities.length > 0
            ? { offerings: { some: { modality: { in: input.modalities } } } }
            : {}),
        },
        include: { offerings: true },
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
          return true;
        });

      filtered.sort((a, b) => {
        const va = verificationOrder[a.c.verificationStatus] ?? 0;
        const vb = verificationOrder[b.c.verificationStatus] ?? 0;
        if (va !== vb) return vb - va; // higher verification first
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return a.c.legalName.localeCompare(b.c.legalName);
      });

      return filtered.slice(0, limit).map<DiscoveryResult>(({ c, lat, lng, distanceKm }) => ({
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
        distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
        categories: Array.from(new Set(c.offerings.map((o) => o.category))),
        modalities: Array.from(new Set(c.offerings.map((o) => o.modality))),
      }));
    }),
});

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
