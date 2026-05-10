import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { parseScope } from '@/lib/rules/deal-templates';
import {
  canActorPerform,
  findTransition,
} from '@/server/services/deal-room-transitions';
import { ensureReviewsForConfirmedDeal } from '@/server/services/reputation';
import { protectedProcedure, router } from '@/server/trpc/trpc';

const dealTemplateSchema = z.enum(['ONE_OFF', 'RECURRING', 'PRODUCT_SUPPLY']);

const dealRoomStatusSchema = z.enum([
  'OPENED',
  'SCOPED',
  'QUOTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'DELIVERED',
  'CONFIRMED',
  'CLOSED',
  'DISPUTED',
  'CANCELLED',
]);

async function loadAndAuthorize(ctx: {
  user: { id: string; companyId?: string };
  repositories: { dealRoom: { findById: (id: string) => Promise<unknown> } };
}, dealRoomId: string) {
  const dr = (await ctx.repositories.dealRoom.findById(dealRoomId)) as
    | { id: string; buyerCompanyId: string; supplierCompanyId: string; status: string }
    | null;
  if (!dr) throw new TRPCError({ code: 'NOT_FOUND' });
  if (!ctx.user.companyId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem empresa vinculada' });
  }
  const role: 'BUYER' | 'SUPPLIER' | null =
    dr.buyerCompanyId === ctx.user.companyId
      ? 'BUYER'
      : dr.supplierCompanyId === ctx.user.companyId
        ? 'SUPPLIER'
        : null;
  if (!role) throw new TRPCError({ code: 'FORBIDDEN', message: 'Não participa deste deal' });
  return { dr, role };
}

export const dealRoomRouter = router({
  open: protectedProcedure
    .input(
      z.object({
        supplierCompanySlug: z.string(),
        template: dealTemplateSchema,
        title: z.string().min(4).max(160),
        scopePayload: z.unknown(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cadastre uma empresa primeiro' });
      }
      const supplier = await ctx.repositories.company.findBySlug(input.supplierCompanySlug);
      if (!supplier) throw new TRPCError({ code: 'NOT_FOUND', message: 'Empresa não encontrada' });
      if (supplier.id === ctx.user.companyId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Comprador e fornecedor não podem ser a mesma empresa',
        });
      }
      const scope = parseScope(input.template, input.scopePayload);

      return ctx.repositories.dealRoom.create({
        buyerCompanyId: ctx.user.companyId,
        supplierCompanyId: supplier.id,
        template: input.template,
        title: input.title,
        scopePayload: scope,
        actorUserId: ctx.user.id,
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { dr, role } = await loadAndAuthorize(ctx, input.id);
      return { dealRoom: dr, viewerRole: role };
    }),

  myDeals: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.companyId) return [];
    const list = await ctx.repositories.dealRoom.listForCompany(ctx.user.companyId);
    return list.map((d) => ({
      ...d,
      viewerRole: d.buyerCompanyId === ctx.user.companyId ? 'BUYER' : 'SUPPLIER',
    }));
  }),

  auditEvents: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      await loadAndAuthorize(ctx, input.id);
      return ctx.repositories.dealRoom.listAuditEvents(input.id);
    }),

  transition: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        to: dealRoomStatusSchema,
        patch: z
          .object({
            scopePayload: z.unknown().optional(),
            quoteCents: z.number().int().min(0).optional(),
            quoteCurrency: z.string().length(3).optional(),
            title: z.string().min(4).max(160).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { dr, role } = await loadAndAuthorize(ctx, input.id);
      const fromStatus = dr.status as
        | 'OPENED'
        | 'SCOPED'
        | 'QUOTED'
        | 'ACCEPTED'
        | 'IN_PROGRESS'
        | 'DELIVERED'
        | 'CONFIRMED'
        | 'CLOSED'
        | 'DISPUTED'
        | 'CANCELLED';
      const transition = findTransition(fromStatus, input.to);
      if (!transition) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Transição inválida: ${dr.status} → ${input.to}`,
        });
      }
      if (!canActorPerform(transition, role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Apenas ${transition.actor === 'EITHER' ? 'partes' : transition.actor} podem fazer isso`,
        });
      }

      // Validate scope on edits.
      if (input.patch?.scopePayload !== undefined) {
        const dealRoom = (await ctx.repositories.dealRoom.findById(input.id)) as {
          template: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY';
        } | null;
        if (dealRoom) {
          input.patch.scopePayload = parseScope(dealRoom.template, input.patch.scopePayload);
        }
      }

      const updated = await ctx.repositories.dealRoom.transition({
        dealRoomId: input.id,
        from: fromStatus,
        to: input.to,
        action: transition.action,
        actorUserId: ctx.user.id,
        patch: input.patch,
      });

      if (input.to === 'CONFIRMED') {
        await ensureReviewsForConfirmedDeal(input.id);
      }

      return updated;
    }),

  attachEvidence: protectedProcedure
    .input(
      z.object({
        dealRoomId: z.string(),
        cycleId: z.string().optional(),
        kind: z.enum(['PHOTO', 'DOC', 'SIGNATURE', 'INVOICE_PREVIEW']),
        url: z.string().url(),
        caption: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await loadAndAuthorize(ctx, input.dealRoomId);
      return ctx.repositories.dealRoom.attachEvidence({
        ...input,
        uploadedById: ctx.user.id,
      });
    }),

  acceptEvidence: protectedProcedure
    .input(z.object({ dealRoomId: z.string(), evidenceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await loadAndAuthorize(ctx, input.dealRoomId);
      return ctx.repositories.dealRoom.acceptEvidence({
        evidenceId: input.evidenceId,
        acceptedById: ctx.user.id,
      });
    }),
});
