import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  adminProcedure,
  ownerProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '@/server/trpc/trpc';

const dealTemplateSchema = z.enum(['ONE_OFF', 'RECURRING', 'PRODUCT_SUPPLY']);

const offeringSchema = z.object({
  category: z.string().min(2).max(80),
  subcategory: z.string().max(80).optional(),
  modality: dealTemplateSchema,
  description: z.string().max(500).optional(),
});

const taxIdSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 14, { message: 'CNPJ deve ter 14 dígitos' });

export const companyRouter = router({
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => ctx.repositories.company.findBySlug(input.slug)),

  myCompanies: protectedProcedure.query(({ ctx }) =>
    ctx.repositories.company.listForUser(ctx.user.id),
  ),

  create: protectedProcedure
    .input(
      z.object({
        legalName: z.string().min(2).max(200),
        tradeName: z.string().max(200).optional(),
        taxId: taxIdSchema,
        description: z.string().max(2000).optional(),
        city: z.string().max(120).optional(),
        state: z.string().max(2).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        serviceRadiusKm: z.number().int().positive().max(5000).optional(),
        // Empty array allowed: company without offerings = buyer-only on the network.
        offerings: z.array(offeringSchema).max(20).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.repositories.company.findByTaxId(input.taxId);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'CNPJ já cadastrado',
        });
      }
      return ctx.repositories.company.create({
        ...input,
        ownerUserId: ctx.user.id,
      });
    }),

  updateMine: ownerProcedure
    .input(
      z.object({
        tradeName: z.string().max(200).nullable().optional(),
        description: z.string().max(2000).nullable().optional(),
        city: z.string().max(120).nullable().optional(),
        state: z.string().max(2).nullable().optional(),
        latitude: z.number().min(-90).max(90).nullable().optional(),
        longitude: z.number().min(-180).max(180).nullable().optional(),
        serviceRadiusKm: z.number().int().positive().max(5000).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.repositories.company.update(ctx.companyId, input),
    ),

  setVerification: adminProcedure
    .input(
      z.object({
        companyId: z.string(),
        status: z.enum(['UNVERIFIED', 'EMAIL_VERIFIED', 'DOC_VERIFIED']),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.repositories.company.setVerificationStatus(input.companyId, input.status),
    ),
});
