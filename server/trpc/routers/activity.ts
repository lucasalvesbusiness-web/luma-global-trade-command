import { z } from 'zod';

import { db } from '@/lib/db';
import { protectedProcedure, router } from '@/server/trpc/trpc';

export const activityRouter = router({
  feed: protectedProcedure
    .input(
      z.object({
        scope: z.enum(['all', 'watching', 'my']).default('all'),
        limit: z.number().int().positive().max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 20;

      let where: Record<string, unknown> = { visibility: 'PUBLIC' };

      if (input.scope === 'my' && ctx.user.companyId) {
        where = {
          visibility: 'PUBLIC',
          OR: [
            { actorCompanyId: ctx.user.companyId },
            { subjectCompanyId: ctx.user.companyId },
          ],
        };
      } else if (input.scope === 'watching' && ctx.user.companyId) {
        const watches = await db.companyWatch.findMany({
          where: { watcherCompanyId: ctx.user.companyId },
          select: { watchedCompanyId: true },
        });
        const watchedIds = watches.map((w) => w.watchedCompanyId);
        if (watchedIds.length === 0) return [];
        where = {
          visibility: 'PUBLIC',
          OR: [
            { actorCompanyId: { in: watchedIds } },
            { subjectCompanyId: { in: watchedIds } },
          ],
        };
      }

      const events = await db.activityEvent.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          actorCompany: {
            select: { id: true, slug: true, legalName: true, tradeName: true },
          },
          subjectCompany: {
            select: { id: true, slug: true, legalName: true, tradeName: true },
          },
        },
      });

      return events.map((e) => ({
        id: e.id,
        type: e.type,
        actor: e.actorCompany,
        subject: e.subjectCompany,
        dealRoomId: e.dealRoomId,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }));
    }),
});
