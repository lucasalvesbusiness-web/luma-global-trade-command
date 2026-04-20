import type { PrismaClient } from '@prisma/client';

import type { ComplianceRepository } from '../interfaces';
import type { CompliancePreview } from '../types';

export function makePrismaComplianceRepository(db: PrismaClient): ComplianceRepository {
  return {
    async previewFor(productSlug, countryIso2): Promise<CompliancePreview | null> {
      const product = await db.product.findUnique({ where: { slug: productSlug } });
      const country = await db.country.findUnique({ where: { iso2: countryIso2 } });
      if (!product || !country) return null;

      const gate = await db.complianceGate.findUnique({
        where: {
          productId_countryIso2: {
            productId: product.id,
            countryIso2: country.iso2,
          },
        },
      });

      const req = await db.phytosanitaryRequirement.findUnique({
        where: {
          productId_countryIso2: {
            productId: product.id,
            countryIso2: country.iso2,
          },
        },
        include: {
          items: { include: { document: true } },
        },
      });

      return {
        productSlug: product.slug,
        productName: product.name,
        countryIso2: country.iso2,
        countryName: country.name,
        status: gate?.status ?? 'PREVIEW_AVAILABLE',
        documents:
          req?.items.map((i) => ({
            code: i.document.code,
            name: i.document.name,
          })) ?? [],
        notes: req?.notes ?? null,
      };
    },

    async previewsForCountry(countryIso2): Promise<CompliancePreview[]> {
      const country = await db.country.findUnique({ where: { iso2: countryIso2 } });
      if (!country) return [];

      const reqs = await db.phytosanitaryRequirement.findMany({
        where: { countryIso2: country.iso2 },
        include: {
          product: true,
          items: { include: { document: true } },
        },
      });

      const gates = await db.complianceGate.findMany({
        where: { countryIso2: country.iso2 },
      });
      const gateByProduct = new Map(gates.map((g) => [g.productId, g.status]));

      return reqs.map((r) => ({
        productSlug: r.product.slug,
        productName: r.product.name,
        countryIso2: country.iso2,
        countryName: country.name,
        status: gateByProduct.get(r.productId) ?? 'PREVIEW_AVAILABLE',
        documents: r.items.map((i) => ({
          code: i.document.code,
          name: i.document.name,
        })),
        notes: r.notes,
      }));
    },
  };
}
