import type { PrismaClient, AvailabilityStatus as PrismaAvailabilityStatus } from '@prisma/client';

import type { AvailabilityRepository } from '../interfaces';
import type {
  AvailabilityStatus,
  AvailabilitySummary,
  HarvestWindowSummary,
} from '../types';

type AvailabilityWithIncludes = {
  id: string;
  volumeTonsBand: string;
  status: PrismaAvailabilityStatus;
  validFrom: Date;
  validTo: Date;
  notes: string | null;
  product: { slug: string; name: string };
  variety: { name: string } | null;
  origin: { slug: string; name: string };
};

function mapAvailability(a: AvailabilityWithIncludes): AvailabilitySummary {
  return {
    id: a.id,
    productSlug: a.product.slug,
    productName: a.product.name,
    varietyName: a.variety?.name ?? null,
    originSlug: a.origin.slug,
    originName: a.origin.name,
    volumeTonsBand: a.volumeTonsBand,
    status: a.status as AvailabilityStatus,
    validFrom: a.validFrom,
    validTo: a.validTo,
    notes: a.notes,
  };
}

export function makePrismaAvailabilityRepository(
  db: PrismaClient,
): AvailabilityRepository {
  return {
    async listForProduct(productSlug, opts) {
      const rows = await db.availability.findMany({
        where: {
          product: { slug: productSlug },
          ...(opts?.statuses
            ? { status: { in: opts.statuses as PrismaAvailabilityStatus[] } }
            : {}),
        },
        include: {
          product: { select: { slug: true, name: true } },
          variety: { select: { name: true } },
          origin: { select: { slug: true, name: true } },
        },
        orderBy: { validFrom: 'asc' },
      });
      return rows.map(mapAvailability);
    },

    async listAll(opts) {
      const rows = await db.availability.findMany({
        where: opts?.statuses
          ? { status: { in: opts.statuses as PrismaAvailabilityStatus[] } }
          : {},
        include: {
          product: { select: { slug: true, name: true } },
          variety: { select: { name: true } },
          origin: { select: { slug: true, name: true } },
        },
        orderBy: { validFrom: 'asc' },
      });
      return rows.map(mapAvailability);
    },

    async harvestWindowsForProduct(productSlug): Promise<HarvestWindowSummary[]> {
      const rows = await db.harvestWindow.findMany({
        where: { product: { slug: productSlug } },
        include: {
          product: { select: { slug: true } },
          variety: { select: { name: true } },
          origin: { select: { slug: true } },
        },
        orderBy: { startDate: 'asc' },
      });
      return rows.map((h) => ({
        productSlug: h.product.slug,
        varietyName: h.variety?.name ?? null,
        originSlug: h.origin.slug,
        startDate: h.startDate,
        endDate: h.endDate,
        confidence: h.confidence,
        notes: h.notes,
      }));
    },
  };
}
