import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { computeReputation } from '@/server/services/reputation';
import { protectedProcedure, publicProcedure, router } from '@/server/trpc/trpc';

export const reviewRouter = router({
  reputationByCompanyId: publicProcedure
    .input(z.object({ companyId: z.string() }))
    .query(({ input }) => computeReputation(input.companyId)),

  pendingForMyCompany: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) return [];
    return db.review.findMany({
      where: {
        raterCompanyId: ctx.user.companyId,
        submittedAt: null,
      },
      include: {
        ratedCompany: { select: { slug: true, legalName: true, tradeName: true } },
        // dealRoomId is FK; surface basic deal info for context
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  submit: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
        category: z.string().max(80).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const review = await db.review.findUnique({ where: { id: input.reviewId } });
      if (!review) throw new TRPCError({ code: 'NOT_FOUND' });
      if (review.raterCompanyId !== ctx.user.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (review.submittedAt) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Review já enviada' });
      }
      const updated = await db.review.update({
        where: { id: input.reviewId },
        data: {
          rating: input.rating,
          comment: input.comment,
          category: input.category,
          submittedAt: new Date(),
        },
      });
      await db.auditEvent.create({
        data: {
          entityType: 'Review',
          entityId: updated.id,
          action: 'REVIEW_SUBMITTED',
          actorId: ctx.user.id,
          diffJson: { rating: input.rating },
        },
      });
      return updated;
    }),
});
