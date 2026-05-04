import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { fieldOperatorProcedure, router } from '../trpc';
import {
  computeRoutineStatus,
  currentCycleWindow,
} from '@/lib/routines/status';

export const fieldRouter = router({
  /**
   * Visão geral da fazenda do operador logado: lista de plots com status de rotina.
   */
  myOrigin: fieldOperatorProcedure.query(async ({ ctx }) => {
    if (!ctx.operator) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const origin = await ctx.db.origin.findUnique({
      where: { id: ctx.operator.originId },
      include: {
        region: true,
        fieldPlots: {
          include: {
            routine: true,
            submissions: {
              orderBy: { submittedAt: 'desc' },
              take: 1,
              include: { photos: true },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!origin) throw new TRPCError({ code: 'NOT_FOUND' });

    const now = new Date();
    return {
      id: origin.id,
      slug: origin.slug,
      name: origin.name,
      region: origin.region.name,
      plots: origin.fieldPlots.map((p) => {
        const last = p.submissions[0]?.submittedAt ?? null;
        const snap = computeRoutineStatus(
          p.routine
            ? { cadenceDays: p.routine.cadenceDays, active: p.routine.active }
            : null,
          last,
          now,
        );
        return {
          id: p.id,
          name: p.name,
          crop: p.crop,
          areaHa: p.areaHa,
          routine: p.routine
            ? {
                cadenceDays: p.routine.cadenceDays,
                minPhotosPerCycle: p.routine.minPhotosPerCycle,
                active: p.routine.active,
                instructions: p.routine.instructions,
              }
            : null,
          ...snap,
          lastSubmission: p.submissions[0]
            ? {
                id: p.submissions[0].id,
                submittedAt: p.submissions[0].submittedAt,
                photoCount: p.submissions[0].photos.length,
              }
            : null,
        };
      }),
    };
  }),

  plotHistory: fieldOperatorProcedure
    .input(z.object({ plotId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const plot = await ctx.db.fieldPlot.findUnique({
        where: { id: input.plotId },
        include: {
          routine: true,
          submissions: {
            orderBy: { submittedAt: 'desc' },
            take: 20,
            include: {
              photos: true,
              submittedBy: { select: { name: true, email: true } },
            },
          },
        },
      });
      if (!plot) throw new TRPCError({ code: 'NOT_FOUND' });

      if (
        ctx.operator &&
        plot.originId !== ctx.operator.originId &&
        !ctx.isAdminOverride
      ) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return {
        id: plot.id,
        name: plot.name,
        crop: plot.crop,
        routine: plot.routine,
        submissions: plot.submissions,
      };
    }),

  /**
   * Cria uma PhotoSubmission a partir de URLs já uploaded ao Vercel Blob.
   * O upload em si acontece em /api/field/upload (route handler com multipart).
   */
  createSubmission: fieldOperatorProcedure
    .input(
      z.object({
        plotId: z.string().uuid(),
        notes: z.string().max(1000).optional(),
        photos: z
          .array(
            z.object({
              url: z.string().url(),
              caption: z.string().max(280).optional(),
            }),
          )
          .min(1)
          .max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.operator && !ctx.isAdminOverride) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const plot = await ctx.db.fieldPlot.findUnique({
        where: { id: input.plotId },
        include: { routine: true },
      });
      if (!plot) throw new TRPCError({ code: 'NOT_FOUND' });
      if (
        ctx.operator &&
        plot.originId !== ctx.operator.originId &&
        !ctx.isAdminOverride
      ) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (!plot.routine?.active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A rotina deste talhão está pausada.',
        });
      }
      if (input.photos.length < plot.routine.minPhotosPerCycle) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Mínimo ${plot.routine.minPhotosPerCycle} fotos por submissão.`,
        });
      }

      const window = currentCycleWindow(plot.routine.cadenceDays);
      const submitterId =
        ctx.operator?.userId ?? ctx.session!.user!.id;

      const submission = await ctx.db.photoSubmission.create({
        data: {
          fieldPlotId: input.plotId,
          submittedById: submitterId,
          notes: input.notes,
          cycleStart: window.cycleStart,
          cycleEnd: window.cycleEnd,
          photos: {
            create: input.photos.map((p) => ({
              storagePath: p.url,
              caption: p.caption,
            })),
          },
        },
        include: { photos: true },
      });

      return { submissionId: submission.id, photoCount: submission.photos.length };
    }),
});
