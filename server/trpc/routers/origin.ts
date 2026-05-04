import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure, protectedProcedure, router } from '../trpc';
import { computeRoutineStatus } from '@/lib/routines/status';
import { sendStaffInvite } from '@/server/mail/staff-invite';

const originKindSchema = z.enum([
  'OWN_FARM',
  'AUDITED_PARTNER',
  'AGROINDUSTRIAL_UNIT',
]);

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'Use minúsculas, números e hífens.');

export const originRouter = router({
  list: adminProcedure
    .input(
      z
        .object({
          includeArchived: z.boolean().default(false),
        })
        .default({ includeArchived: false }),
    )
    .query(async ({ ctx, input }) => {
      const origins = await ctx.db.origin.findMany({
        where: input.includeArchived ? {} : { archivedAt: null },
        include: {
          region: true,
          _count: {
            select: { fieldPlots: true, fieldOperators: true },
          },
        },
        orderBy: [{ archivedAt: 'asc' }, { name: 'asc' }],
      });
      return origins.map((o) => ({
        id: o.id,
        slug: o.slug,
        name: o.name,
        kind: o.kind,
        region: { id: o.region.id, name: o.region.name },
        statusBlurb: o.statusBlurb,
        archivedAt: o.archivedAt,
        plotCount: o._count.fieldPlots,
        operatorCount: o._count.fieldOperators,
      }));
    }),

  get: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const origin = await ctx.db.origin.findUnique({
        where: { slug: input.slug },
        include: {
          region: true,
          fieldPlots: {
            include: {
              routine: true,
              submissions: {
                orderBy: { submittedAt: 'desc' },
                take: 1,
              },
            },
            orderBy: { name: 'asc' },
          },
          packingHouses: { orderBy: { name: 'asc' } },
          coldChambers: { orderBy: { name: 'asc' } },
          fieldOperators: { include: { user: true } },
          archivedBy: { select: { id: true, name: true, email: true } },
        },
      });
      if (!origin) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const now = new Date();
      return {
        ...origin,
        plots: origin.fieldPlots.map((p) => {
          const last = p.submissions[0]?.submittedAt ?? null;
          const snapshot = computeRoutineStatus(
            p.routine
              ? { cadenceDays: p.routine.cadenceDays, active: p.routine.active }
              : null,
            last,
            now,
          );
          return { ...p, lastSubmissionAt: last, ...snapshot };
        }),
      };
    }),

  listRegions: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.originRegion.findMany({ orderBy: { name: 'asc' } });
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2).max(160).trim(),
        slug: slugSchema,
        kind: originKindSchema,
        regionId: z.string().uuid(),
        lat: z.number().min(-90).max(90).nullable().optional(),
        lng: z.number().min(-180).max(180).nullable().optional(),
        statusBlurb: z.string().max(500).nullable().optional(),
        approvedCertifications: z.array(z.string().max(60)).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.origin.findUnique({ where: { slug: input.slug } });
      if (exists) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Slug já utilizado.' });
      }
      const origin = await ctx.db.origin.create({
        data: {
          name: input.name,
          slug: input.slug,
          kind: input.kind,
          regionId: input.regionId,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          statusBlurb: input.statusBlurb ?? null,
          approvedCertifications: input.approvedCertifications,
        },
      });
      return { id: origin.id, slug: origin.slug };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(2).max(160).trim().optional(),
        kind: originKindSchema.optional(),
        regionId: z.string().uuid().optional(),
        lat: z.number().min(-90).max(90).nullable().optional(),
        lng: z.number().min(-180).max(180).nullable().optional(),
        statusBlurb: z.string().max(500).nullable().optional(),
        approvedCertifications: z.array(z.string().max(60)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      await ctx.db.origin.update({ where: { id }, data: patch });
      return { ok: true };
    }),

  archive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.origin.update({
        where: { id: input.id },
        data: { archivedAt: new Date(), archivedById: ctx.admin.userId },
      });
      return { ok: true };
    }),

  restore: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.origin.update({
        where: { id: input.id },
        data: { archivedAt: null, archivedById: null },
      });
      return { ok: true };
    }),

  // ============ Field plots ============
  createPlot: adminProcedure
    .input(
      z.object({
        originId: z.string().uuid(),
        name: z.string().min(2).max(120).trim(),
        crop: z.string().min(2).max(80).trim(),
        areaHa: z.number().positive().nullable().optional(),
        lat: z.number().min(-90).max(90).nullable().optional(),
        lng: z.number().min(-180).max(180).nullable().optional(),
        cadenceDays: z.number().int().min(1).max(180).default(7),
        minPhotosPerCycle: z.number().int().min(1).max(50).default(3),
        instructions: z.string().max(1000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plot = await ctx.db.fieldPlot.create({
        data: {
          originId: input.originId,
          name: input.name,
          crop: input.crop,
          areaHa: input.areaHa ?? null,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          routine: {
            create: {
              cadenceDays: input.cadenceDays,
              minPhotosPerCycle: input.minPhotosPerCycle,
              instructions: input.instructions ?? null,
            },
          },
        },
      });
      return { id: plot.id };
    }),

  updatePlot: adminProcedure
    .input(
      z.object({
        plotId: z.string().uuid(),
        name: z.string().min(2).max(120).trim().optional(),
        crop: z.string().min(2).max(80).trim().optional(),
        areaHa: z.number().positive().nullable().optional(),
        lat: z.number().min(-90).max(90).nullable().optional(),
        lng: z.number().min(-180).max(180).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { plotId, ...patch } = input;
      await ctx.db.fieldPlot.update({ where: { id: plotId }, data: patch });
      return { ok: true };
    }),

  deletePlot: adminProcedure
    .input(z.object({ plotId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.fieldPlot.delete({ where: { id: input.plotId } });
      return { ok: true };
    }),

  updateRoutine: adminProcedure
    .input(
      z.object({
        plotId: z.string().uuid(),
        cadenceDays: z.number().int().min(1).max(180).optional(),
        minPhotosPerCycle: z.number().int().min(1).max(50).optional(),
        active: z.boolean().optional(),
        instructions: z.string().max(1000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { plotId, ...patch } = input;
      await ctx.db.photoRoutine.upsert({
        where: { fieldPlotId: plotId },
        create: {
          fieldPlotId: plotId,
          cadenceDays: patch.cadenceDays ?? 7,
          minPhotosPerCycle: patch.minPhotosPerCycle ?? 3,
          active: patch.active ?? true,
          instructions: patch.instructions ?? null,
        },
        update: patch,
      });
      return { ok: true };
    }),

  // ============ Field operators ============
  inviteOperator: adminProcedure
    .input(
      z.object({
        originId: z.string().uuid(),
        email: z.string().email().toLowerCase().trim(),
        name: z.string().min(2).max(120).trim(),
        title: z.string().max(120).trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const origin = await ctx.db.origin.findUnique({
        where: { id: input.originId },
      });
      if (!origin) throw new TRPCError({ code: 'NOT_FOUND' });

      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        include: { staff: true, buyer: true, fieldOperator: true },
      });

      if (existing?.staff) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este e-mail já é membro do time Luma.',
        });
      }
      if (existing?.buyer) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este e-mail já está cadastrado como comprador.',
        });
      }
      if (existing?.fieldOperator) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este e-mail já é operador de outra fazenda.',
        });
      }

      const user =
        existing ??
        (await ctx.db.user.create({
          data: {
            email: input.email,
            name: input.name,
            role: 'FIELD_OPERATOR',
          },
        }));

      if (existing && existing.role !== 'FIELD_OPERATOR') {
        await ctx.db.user.update({
          where: { id: user.id },
          data: { role: 'FIELD_OPERATOR', name: input.name },
        });
      }

      const op = await ctx.db.fieldOperator.create({
        data: {
          userId: user.id,
          originId: input.originId,
          title: input.title,
        },
      });

      const inviter = await ctx.db.user.findUnique({
        where: { id: ctx.admin.userId },
        select: { name: true, email: true },
      });
      const baseUrl =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';

      try {
        await sendStaffInvite({
          to: input.email,
          inviteeName: input.name,
          role: 'STAFF',
          team: 'OPERATIONS',
          inviterName: inviter?.name ?? inviter?.email ?? 'Equipe Luma',
          baseUrl: `${baseUrl}/field/${origin.slug}`,
        });
      } catch (err) {
        console.error('[origin.inviteOperator] falha ao enviar e-mail', err);
      }

      return { operatorId: op.id, userId: user.id };
    }),

  removeOperator: adminProcedure
    .input(z.object({ operatorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const op = await ctx.db.fieldOperator.findUnique({
        where: { id: input.operatorId },
      });
      if (!op) throw new TRPCError({ code: 'NOT_FOUND' });
      await ctx.db.fieldOperator.delete({ where: { id: input.operatorId } });
      await ctx.db.user.update({
        where: { id: op.userId },
        data: { role: 'BUYER' },
      });
      return { ok: true };
    }),

  routinesDashboard: adminProcedure.query(async ({ ctx }) => {
    const origins = await ctx.db.origin.findMany({
      where: { archivedAt: null },
      include: {
        fieldPlots: {
          include: {
            routine: true,
            submissions: { orderBy: { submittedAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    const now = new Date();
    return origins.map((o) => ({
      id: o.id,
      slug: o.slug,
      name: o.name,
      plots: o.fieldPlots.map((p) => {
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
          ...snap,
          lastSubmissionAt: last,
          cadenceDays: p.routine?.cadenceDays ?? null,
        };
      }),
    }));
  }),
});
