import type { PrismaClient } from '@prisma/client';

import type { CatalogRepository } from '../interfaces';
import type { ProductDetail, ProductSummary } from '../types';

export function makePrismaCatalogRepository(db: PrismaClient): CatalogRepository {
  const mapSummary = (p: {
    id: string;
    slug: string;
    name: string;
    summary: string | null;
    tempRangeMinC: number | null;
    tempRangeMaxC: number | null;
    shelfLifeDaysMin: number | null;
    shelfLifeDaysMax: number | null;
    recommendedContainerKind: ProductSummary['recommendedContainerKind'];
    heroImage: string | null;
    category: { slug: string };
  }): ProductSummary => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    summary: p.summary,
    categorySlug: p.category.slug,
    tempRangeMinC: p.tempRangeMinC,
    tempRangeMaxC: p.tempRangeMaxC,
    shelfLifeDaysMin: p.shelfLifeDaysMin,
    shelfLifeDaysMax: p.shelfLifeDaysMax,
    recommendedContainerKind: p.recommendedContainerKind,
    heroImage: p.heroImage,
  });

  return {
    async listProducts() {
      const rows = await db.product.findMany({
        include: { category: { select: { slug: true } } },
        orderBy: { name: 'asc' },
      });
      return rows.map(mapSummary);
    },

    async findProductBySlug(slug) {
      const row = await db.product.findUnique({
        where: { slug },
        include: {
          category: { select: { slug: true } },
          varieties: { orderBy: { name: 'asc' } },
        },
      });
      if (!row) return null;
      const detail: ProductDetail = {
        ...mapSummary(row),
        varieties: row.varieties.map((v) => ({
          id: v.id,
          name: v.name,
          boxWeightKg: v.boxWeightKg,
          boxDimensions: v.boxDimensions,
          palletConfig: v.palletConfig,
        })),
      };
      return detail;
    },

    async listByCategory(categorySlug) {
      const rows = await db.product.findMany({
        where: { category: { slug: categorySlug } },
        include: { category: { select: { slug: true } } },
        orderBy: { name: 'asc' },
      });
      return rows.map(mapSummary);
    },
  };
}
