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

const confidenceLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

const complianceGateStatusSchema = z.enum([
  'PREVIEW_AVAILABLE',
  'REQUIREMENTS_PENDING',
  'DOCUMENTATION_REQUIRED',
  'SUBJECT_TO_FINAL_VALIDATION',
  'BLOCKED',
  'CLEARED_INTERNALLY',
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
    const [products, origins, countries] = await Promise.all([
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
      ctx.db.country.findMany({
        select: { iso2: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { products, origins, countries };
  }),

  // ============ Harvest Windows ============
  listHarvestWindows: adminProcedure.query(({ ctx }) =>
    ctx.db.harvestWindow.findMany({
      include: {
        product: { select: { slug: true, name: true } },
        variety: { select: { id: true, name: true } },
        origin: { select: { slug: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
    }),
  ),

  createHarvestWindow: adminProcedure
    .input(
      z.object({
        productSlug: z.string().min(1),
        varietyId: z.string().uuid().nullable(),
        originSlug: z.string().min(1),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        confidence: confidenceLevelSchema,
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.endDate < input.startDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'endDate anterior a startDate',
        });
      }
      const [product, origin] = await Promise.all([
        ctx.db.product.findUnique({ where: { slug: input.productSlug } }),
        ctx.db.origin.findUnique({ where: { slug: input.originSlug } }),
      ]);
      if (!product || !origin) throw new TRPCError({ code: 'NOT_FOUND' });
      return ctx.db.harvestWindow.create({
        data: {
          productId: product.id,
          varietyId: input.varietyId,
          originId: origin.id,
          startDate: input.startDate,
          endDate: input.endDate,
          confidence: input.confidence,
          notes: input.notes,
        },
      });
    }),

  updateHarvestWindow: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        confidence: confidenceLevelSchema,
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (input.endDate < input.startDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'endDate anterior a startDate',
        });
      }
      const { id, ...data } = input;
      return ctx.db.harvestWindow.update({ where: { id }, data });
    }),

  deleteHarvestWindow: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.harvestWindow.delete({ where: { id: input.id } }),
    ),

  // ============ Photo Approval Queue ============
  listFieldPhotos: adminProcedure
    .input(
      z
        .object({ pendingOnly: z.boolean().default(true) })
        .optional(),
    )
    .query(({ ctx, input }) =>
      ctx.db.fieldPhoto.findMany({
        where: input?.pendingOnly === false ? undefined : { approvedForBuyerView: false },
        include: {
          fieldUpdate: {
            select: {
              id: true,
              observedAt: true,
              stage: true,
              origin: { select: { slug: true, name: true } },
            },
          },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ),

  approveFieldPhoto: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.fieldPhoto.update({
        where: { id: input.id },
        data: {
          approvedForBuyerView: true,
          approvedByUserId: ctx.admin.userId,
          approvedAt: new Date(),
        },
      }),
    ),

  unapproveFieldPhoto: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.fieldPhoto.update({
        where: { id: input.id },
        data: {
          approvedForBuyerView: false,
          approvedByUserId: null,
          approvedAt: null,
        },
      }),
    ),

  deleteFieldPhoto: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.fieldPhoto.delete({ where: { id: input.id } }),
    ),

  // ============ Requirements Matrix ============
  listDocumentRequirements: adminProcedure.query(({ ctx }) =>
    ctx.db.documentRequirement.findMany({ orderBy: { code: 'asc' } }),
  ),

  upsertDocumentRequirement: adminProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        code: z.string().min(1).max(40),
        name: z.string().min(1).max(160),
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (input.id) {
        const { id, ...data } = input;
        return ctx.db.documentRequirement.update({ where: { id }, data });
      }
      return ctx.db.documentRequirement.create({
        data: { code: input.code, name: input.name, notes: input.notes },
      });
    }),

  deleteDocumentRequirement: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const refs = await ctx.db.phytosanitaryRequirementItem.count({
        where: { documentRequirementId: input.id },
      });
      if (refs > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Documento referenciado em requisitos. Remova-os primeiro.',
        });
      }
      return ctx.db.documentRequirement.delete({ where: { id: input.id } });
    }),

  /** Lista todos PhytosanitaryRequirement com items + ComplianceGate por (produto, país). */
  listRequirementsMatrix: adminProcedure.query(async ({ ctx }) => {
    const [requirements, gates] = await Promise.all([
      ctx.db.phytosanitaryRequirement.findMany({
        include: {
          product: { select: { slug: true, name: true } },
          country: { select: { iso2: true, name: true } },
          items: {
            include: {
              document: { select: { id: true, code: true, name: true } },
            },
          },
        },
        orderBy: [{ countryIso2: 'asc' }, { product: { name: 'asc' } }],
      }),
      ctx.db.complianceGate.findMany({
        include: {
          product: { select: { slug: true } },
          country: { select: { iso2: true } },
        },
      }),
    ]);
    return { requirements, gates };
  }),

  upsertRequirement: adminProcedure
    .input(
      z.object({
        productSlug: z.string().min(1),
        countryIso2: z.string().length(2),
        notes: z.string().max(800).nullable(),
        documentRequirementIds: z.array(
          z.object({
            documentRequirementId: z.string().uuid(),
            mandatory: z.boolean(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.productSlug },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
      return ctx.db.$transaction(async (tx) => {
        const req = await tx.phytosanitaryRequirement.upsert({
          where: {
            productId_countryIso2: {
              productId: product.id,
              countryIso2: input.countryIso2,
            },
          },
          update: { notes: input.notes },
          create: {
            productId: product.id,
            countryIso2: input.countryIso2,
            notes: input.notes,
          },
        });
        await tx.phytosanitaryRequirementItem.deleteMany({
          where: { phytosanitaryRequirementId: req.id },
        });
        if (input.documentRequirementIds.length > 0) {
          await tx.phytosanitaryRequirementItem.createMany({
            data: input.documentRequirementIds.map((d) => ({
              phytosanitaryRequirementId: req.id,
              documentRequirementId: d.documentRequirementId,
              mandatory: d.mandatory,
            })),
          });
        }
        return req;
      });
    }),

  deleteRequirement: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.phytosanitaryRequirement.delete({ where: { id: input.id } }),
    ),

  upsertComplianceGate: adminProcedure
    .input(
      z.object({
        productSlug: z.string().min(1),
        countryIso2: z.string().length(2),
        status: complianceGateStatusSchema,
        notes: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.productSlug },
      });
      if (!product) throw new TRPCError({ code: 'NOT_FOUND' });
      const existing = await ctx.db.complianceGate.findFirst({
        where: { productId: product.id, countryIso2: input.countryIso2 },
      });
      if (existing) {
        return ctx.db.complianceGate.update({
          where: { id: existing.id },
          data: { status: input.status, notes: input.notes },
        });
      }
      return ctx.db.complianceGate.create({
        data: {
          productId: product.id,
          countryIso2: input.countryIso2,
          status: input.status,
          notes: input.notes,
        },
      });
    }),
});
