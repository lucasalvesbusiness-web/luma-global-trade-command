import type { PrismaClient } from '@prisma/client';

import type { GeoRepository } from '../interfaces';
import type { CountrySummary, OriginSummary, PortSummary } from '../types';

export function makePrismaGeoRepository(db: PrismaClient): GeoRepository {
  return {
    async listCountries(): Promise<CountrySummary[]> {
      const rows = await db.country.findMany({ orderBy: { name: 'asc' } });
      return rows.map((c) => ({
        iso2: c.iso2,
        iso3: c.iso3,
        name: c.name,
        region: c.region,
      }));
    },

    async portsByCountry(iso2): Promise<PortSummary[]> {
      const rows = await db.port.findMany({
        where: { countryIso2: iso2 },
        orderBy: { name: 'asc' },
      });
      return rows.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        countryIso2: p.countryIso2,
      }));
    },

    async listOrigins(): Promise<OriginSummary[]> {
      const rows = await db.origin.findMany({ orderBy: { name: 'asc' } });
      return rows.map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name,
        kind: o.kind,
        lat: o.lat,
        lng: o.lng,
        statusBlurb: o.statusBlurb,
        approvedCertifications: o.approvedCertifications,
      }));
    },
  };
}
