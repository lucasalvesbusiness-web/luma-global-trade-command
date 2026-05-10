import { z } from 'zod';

import { db } from '@/lib/db';
import { protectedProcedure, router } from '@/server/trpc/trpc';

export const searchRouter = router({
  global: protectedProcedure
    .input(z.object({ q: z.string().min(1).max(80) }))
    .query(async ({ ctx, input }) => {
      const q = input.q.trim();

      const [companies, deals] = await Promise.all([
        db.company.findMany({
          where: {
            OR: [
              { legalName: { contains: q } },
              { tradeName: { contains: q } },
              { description: { contains: q } },
              { slug: { contains: q } },
            ],
          },
          select: {
            id: true,
            slug: true,
            legalName: true,
            tradeName: true,
            verificationStatus: true,
            city: true,
          },
          take: 8,
        }),
        ctx.user.companyId
          ? db.dealRoom.findMany({
              where: {
                AND: [
                  {
                    OR: [
                      { buyerCompanyId: ctx.user.companyId },
                      { supplierCompanyId: ctx.user.companyId },
                    ],
                  },
                  { title: { contains: q } },
                ],
              },
              select: { id: true, title: true, status: true, template: true },
              orderBy: { updatedAt: 'desc' },
              take: 5,
            })
          : Promise.resolve([]),
      ]);

      // Categories: derive distinct categories matching from offerings.
      const offerings = await db.serviceOffering.findMany({
        where: { category: { contains: q } },
        select: { category: true },
        distinct: ['category'],
        take: 5,
      });

      return {
        companies,
        deals,
        categories: offerings.map((o) => o.category),
      };
    }),
});
