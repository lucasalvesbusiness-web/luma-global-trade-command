import type { PrismaClient } from '@prisma/client';

import type { FieldRepository } from '../interfaces';
import type { FieldUpdateSummary } from '../types';

export function makePrismaFieldRepository(db: PrismaClient): FieldRepository {
  return {
    async latestByOriginSlugs(originSlugs): Promise<FieldUpdateSummary[]> {
      if (originSlugs.length === 0) return [];

      // Busca todos os updates das origens informadas e pega o mais recente
      // por origem. Dataset pequeno — fazemos in-memory.
      const rows = await db.fieldUpdate.findMany({
        where: { origin: { slug: { in: originSlugs } } },
        include: { origin: true },
        orderBy: { observedAt: 'desc' },
      });

      const latestByOrigin = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        if (!latestByOrigin.has(row.origin.slug)) {
          latestByOrigin.set(row.origin.slug, row);
        }
      }

      return [...latestByOrigin.values()].map((u) => ({
        id: u.id,
        originSlug: u.origin.slug,
        originName: u.origin.name,
        observedAt: u.observedAt,
        stage: u.stage,
        conditionNote: u.conditionNote,
        riskSummary: u.riskSummary,
        confidence: u.confidence,
        originLat: u.origin.lat,
        originLng: u.origin.lng,
      }));
    },
  };
}
