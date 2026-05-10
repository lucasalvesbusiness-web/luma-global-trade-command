import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { protectedProcedure, router } from '@/server/trpc/trpc';

export const watchRouter = router({
  isWatching: protectedProcedure
    .input(z.object({ targetCompanyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user.companyId) return false;
      const watch = await db.companyWatch.findUnique({
        where: {
          watcherCompanyId_watchedCompanyId: {
            watcherCompanyId: ctx.user.companyId,
            watchedCompanyId: input.targetCompanyId,
          },
        },
      });
      return !!watch;
    }),

  toggle: protectedProcedure
    .input(z.object({ targetCompanyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cadastre uma empresa primeiro.',
        });
      }
      if (ctx.user.companyId === input.targetCompanyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Não é possível acompanhar a própria empresa.',
        });
      }
      const existing = await db.companyWatch.findUnique({
        where: {
          watcherCompanyId_watchedCompanyId: {
            watcherCompanyId: ctx.user.companyId,
            watchedCompanyId: input.targetCompanyId,
          },
        },
      });
      if (existing) {
        await db.companyWatch.delete({ where: { id: existing.id } });
        return { watching: false };
      }
      await db.companyWatch.create({
        data: {
          watcherCompanyId: ctx.user.companyId,
          watchedCompanyId: input.targetCompanyId,
        },
      });
      return { watching: true };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) return [];
    const watches = await db.companyWatch.findMany({
      where: { watcherCompanyId: ctx.user.companyId },
      include: {
        watched: {
          select: {
            id: true,
            slug: true,
            legalName: true,
            tradeName: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return watches.map((w) => ({ ...w.watched, watchedAt: w.createdAt }));
  }),
});
