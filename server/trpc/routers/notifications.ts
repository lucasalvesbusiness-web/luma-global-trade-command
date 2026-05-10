import { z } from 'zod';

import { db } from '@/lib/db';
import { protectedProcedure, router } from '@/server/trpc/trpc';

export const notificationsRouter = router({
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.notification.count({
      where: { userId: ctx.user.id, readAt: null },
    });
  }),

  list: protectedProcedure
    .input(
      z
        .object({
          unreadOnly: z.boolean().optional(),
          limit: z.number().int().positive().max(50).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return db.notification.findMany({
        where: {
          userId: ctx.user.id,
          ...(input?.unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input?.limit ?? 30,
      });
    }),

  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await db.notification.updateMany({
        where: { id: { in: input.ids }, userId: ctx.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return { ok: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.notification.updateMany({
      where: { userId: ctx.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }),
});
