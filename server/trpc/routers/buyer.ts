import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  adminProcedure,
  protectedProcedure,
  router,
} from '../trpc';
import { notifyBuyerStatusChange } from '@/server/mail/buyer-signup-notification';

const companyTypeSchema = z.enum([
  'IMPORTER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'RETAIL',
  'INDUSTRY',
  'TRADER',
]);

const approvalStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'BLOCKED',
]);

export const buyerRouter = router({
  /**
   * Status do buyer logado — usado por middleware/canvas para gating.
   */
  myStatus: protectedProcedure.query(async ({ ctx }) => {
    const buyer = await ctx.db.buyer.findUnique({
      where: { userId: ctx.session.user!.id },
      include: { company: true },
    });
    if (!buyer) return null;
    return {
      buyerId: buyer.id,
      company: {
        id: buyer.company.id,
        legalName: buyer.company.legalName,
        approvalStatus: buyer.company.approvalStatus,
        onboardingCompletedAt: buyer.company.onboardingCompletedAt,
      },
    };
  }),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        displayName: z.string().max(120).trim().optional(),
        city: z.string().max(120).trim().optional(),
        address: z.string().max(280).trim().optional(),
        contactPhone: z.string().max(40).trim().optional(),
        defaultIncoterm: z.string().max(8).trim().optional(),
        estimatedMonthlyVolume: z.string().max(60).trim().optional(),
        productsOfInterest: z.array(z.string().max(60)).default([]),
        targetMarkets: z.array(z.string().length(2)).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const buyer = await ctx.db.buyer.findUnique({
        where: { userId: ctx.session.user!.id },
        include: { company: true },
      });
      if (!buyer) throw new TRPCError({ code: 'NOT_FOUND' });
      if (buyer.company.approvalStatus !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Aguardando aprovação.',
        });
      }
      await ctx.db.buyerCompany.update({
        where: { id: buyer.companyId },
        data: {
          ...input,
          onboardingCompletedAt: new Date(),
        },
      });
      return { ok: true };
    }),

  // ============ Admin operations ============
  adminList: adminProcedure
    .input(
      z
        .object({ status: approvalStatusSchema.optional() })
        .default({ status: undefined }),
    )
    .query(async ({ ctx, input }) => {
      const companies = await ctx.db.buyerCompany.findMany({
        where: input.status ? { approvalStatus: input.status } : {},
        include: {
          buyers: { include: { user: true } },
          country: true,
          _count: { select: { proposals: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return companies.map((c) => ({
        id: c.id,
        legalName: c.legalName,
        displayName: c.displayName,
        type: c.type,
        country: { iso2: c.country.iso2, name: c.country.name },
        approvalStatus: c.approvalStatus,
        rejectionReason: c.rejectionReason,
        onboardingCompletedAt: c.onboardingCompletedAt,
        createdAt: c.createdAt,
        approvedAt: c.approvedAt,
        proposalCount: c._count.proposals,
        primaryContact: c.buyers[0]
          ? {
              name: c.buyers[0].user.name,
              email: c.buyers[0].user.email,
            }
          : null,
      }));
    }),

  adminGet: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const company = await ctx.db.buyerCompany.findUnique({
        where: { id: input.id },
        include: {
          buyers: { include: { user: true } },
          country: true,
          approvedBy: { select: { id: true, name: true, email: true } },
          proposals: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              reference: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });
      if (!company) throw new TRPCError({ code: 'NOT_FOUND' });
      return company;
    }),

  adminApprove: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.buyerCompany.findUnique({
        where: { id: input.id },
        include: { buyers: { include: { user: true } } },
      });
      if (!company) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.db.buyerCompany.update({
        where: { id: input.id },
        data: {
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
          approvedById: ctx.admin.userId,
          rejectionReason: null,
        },
      });

      const baseUrl =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';

      for (const b of company.buyers) {
        try {
          await notifyBuyerStatusChange({
            to: b.user.email,
            buyerName: b.user.name ?? b.user.email,
            companyLegalName: company.legalName,
            status: 'APPROVED',
            baseUrl,
          });
        } catch (err) {
          console.error('[buyer.adminApprove] falha de e-mail', err);
        }
      }
      return { ok: true };
    }),

  adminReject: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string().min(2).max(500).trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.buyerCompany.findUnique({
        where: { id: input.id },
        include: { buyers: { include: { user: true } } },
      });
      if (!company) throw new TRPCError({ code: 'NOT_FOUND' });

      await ctx.db.buyerCompany.update({
        where: { id: input.id },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: input.reason,
          approvedById: ctx.admin.userId,
          approvedAt: new Date(),
        },
      });

      const baseUrl =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';

      for (const b of company.buyers) {
        try {
          await notifyBuyerStatusChange({
            to: b.user.email,
            buyerName: b.user.name ?? b.user.email,
            companyLegalName: company.legalName,
            status: 'REJECTED',
            rejectionReason: input.reason,
            baseUrl,
          });
        } catch (err) {
          console.error('[buyer.adminReject] falha de e-mail', err);
        }
      }
      return { ok: true };
    }),

  adminBlock: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.buyerCompany.findUnique({
        where: { id: input.id },
        include: { buyers: { include: { user: true } } },
      });
      if (!company) throw new TRPCError({ code: 'NOT_FOUND' });
      await ctx.db.buyerCompany.update({
        where: { id: input.id },
        data: { approvalStatus: 'BLOCKED' },
      });
      const baseUrl =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';
      for (const b of company.buyers) {
        try {
          await notifyBuyerStatusChange({
            to: b.user.email,
            buyerName: b.user.name ?? b.user.email,
            companyLegalName: company.legalName,
            status: 'BLOCKED',
            baseUrl,
          });
        } catch (err) {
          console.error('[buyer.adminBlock] falha de e-mail', err);
        }
      }
      return { ok: true };
    }),

  adminUnblock: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.buyerCompany.update({
        where: { id: input.id },
        data: { approvalStatus: 'APPROVED' },
      });
      return { ok: true };
    }),
});
