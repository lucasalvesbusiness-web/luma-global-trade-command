import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure, router } from '../trpc';

const recommendedContainerKindSchema = z.enum([
  'REEFER_20',
  'REEFER_40',
  'REEFER_40_HC',
  'DRY_20',
  'DRY_40',
]);

const availabilityStatusSchema = z.enum([
  'AVAILABLE_NOW',
  'PRE_RESERVE_OPEN',
  'UNDER_TECHNICAL_VALIDATION',
  'LIMITED_AVAILABILITY',
  'UNDER_CONSULTATION',
  'NOT_AVAILABLE_FOR_DESTINATION',
]);

export const adminRouter = router({
  // ============ Dashboard ============
  stats: adminProcedure.query(async ({ ctx }) => {
    const [products, origins, availabilities, proposalsByStatus, fieldPhotos] =
      await Promise.all([
        ctx.db.product.count(),
        ctx.db.origin.count(),
        ctx.db.availability.count(),
        ctx.db.proposal.groupBy({ by: ['status'], _count: true }),
        ctx.db.fieldPhoto.count({ where: { approvedForBuyerView: false } }),
      ]);
    return {
      products,
      origins,
      availabilities,
      proposalsByStatus,
      pendingPhotos: fieldPhotos,
    };
  }),

  // ============ Products ============
  listProducts: adminProcedure.query(({ ctx }) =>
    ctx.db.product.findMany({
      include: { category: true, varieties: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    }),
  ),

  productDetail: adminProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug },
        include: { category: true, varieties: { orderBy: { name: 'asc' } } },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
      return product;
    }),

  updateProduct: adminProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1).max(120),
        summary: z.string().max(800).nullable(),
        tempRangeMinC: z.number().nullable(),
        tempRangeMaxC: z.number().nullable(),
        shelfLifeDaysMin: z.number().int().nonnegative().nullable(),
        shelfLifeDaysMax: z.number().int().nonnegative().nullable(),
        recommendedContainerKind: recommendedContainerKindSchema,
      }),
    )
    .mutation(({ ctx, input }) => {
      const { slug, ...data } = input;
      return ctx.db.product.update({ where: { slug }, data });
    }),

  createVariety: adminProcedure
    .input(
      z.object({
        productSlug: z.string().min(1),
        name: z.string().min(1).max(80),
        boxWeightKg: z.number().positive(),
        boxDimensions: z.string().max(80).nullable(),
        palletConfig: z.string().max(80).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.productSlug },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
      return ctx.db.variety.create({
        data: {
          productId: product.id,
          name: input.name,
          boxWeightKg: input.boxWeightKg,
          boxDimensions: input.boxDimensions,
          palletConfig: input.palletConfig,
        },
      });
    }),

  updateVariety: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80),
        boxWeightKg: z.number().positive(),
        boxDimensions: z.string().max(80).nullable(),
        palletConfig: z.string().max(80).nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.variety.update({ where: { id }, data });
    }),

  deleteVariety: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Protege contra exclusão se há availabilities/load items usando
      const refs = await ctx.db.availability.count({ where: { varietyId: input.id } });
      if (refs > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Variedade tem disponibilidades associadas. Remova-as primeiro.',
        });
      }
      return ctx.db.variety.delete({ where: { id: input.id } });
    }),

  // ============ Availability ============
  listAvailabilities: adminProcedure.query(({ ctx }) =>
    ctx.db.availability.findMany({
      include: {
        product: { select: { slug: true, name: true } },
        variety: { select: { id: true, name: true } },
        origin: { select: { slug: true, name: true } },
      },
      orderBy: { validFrom: 'desc' },
    }),
  ),

  createAvailability: adminProcedure
    .input(
      z.object({
        productSlug: z.string().min(1),
        varietyId: z.string().uuid().nullable(),
        originSlug: z.string().min(1),
        volumeTonsBand: z.string().min(1).max(40),
        status: availabilityStatusSchema,
        validFrom: z.coerce.date(),
        validTo: z.coerce.date(),
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [product, origin] = await Promise.all([
        ctx.db.product.findUnique({ where: { slug: input.productSlug } }),
        ctx.db.origin.findUnique({ where: { slug: input.originSlug } }),
      ]);
      if (!product || !origin) throw new TRPCError({ code: 'NOT_FOUND' });

      return ctx.db.availability.create({
        data: {
          productId: product.id,
          varietyId: input.varietyId,
          originId: origin.id,
          volumeTonsBand: input.volumeTonsBand,
          status: input.status,
          validFrom: input.validFrom,
          validTo: input.validTo,
          notes: input.notes,
        },
      });
    }),

  updateAvailability: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        volumeTonsBand: z.string().min(1).max(40),
        status: availabilityStatusSchema,
        validFrom: z.coerce.date(),
        validTo: z.coerce.date(),
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.availability.update({ where: { id }, data });
    }),

  deleteAvailability: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.availability.delete({ where: { id: input.id } }),
    ),

  // ============ Refs para selects ============
  refsForForms: adminProcedure.query(async ({ ctx }) => {
    const [products, origins] = await Promise.all([
      ctx.db.product.findMany({
        select: {
          slug: true,
          name: true,
          varieties: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      ctx.db.origin.findMany({
        select: { slug: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { products, origins };
  }),
});
