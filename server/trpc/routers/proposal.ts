import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { submitProposalFromDraft } from '@/server/services/proposal';
import { applyProposalTransition } from '@/server/services/proposal-transitions';
import { sendProposalNotification } from '@/server/mail/proposal-notification';

import { buyerProcedure, publicProcedure, router } from '../trpc';

const containerCodeSchema = z.enum([
  'C_20_RF',
  'C_40_RF',
  'C_40_HC_RF',
  'C_20_DR',
  'C_40_DR',
]);

const buyerTypeSchema = z.enum([
  'IMPORTER',
  'DISTRIBUTOR',
  'WHOLESALER',
  'RETAIL',
  'INDUSTRY',
  'TRADER',
]);

const submitInput = z.object({
  destinationCountryIso2: z.string().length(2).toUpperCase(),
  // Aceita tanto seed id ("port-rotterdam") quanto UUID do DB — o service resolve.
  destinationPortId: z.string().min(1).nullable().optional(),
  incoterm: z.string().min(2).max(6).nullable().optional(),
  buyer: z.object({
    legalName: z.string().min(2).max(180),
    displayName: z.string().max(120).nullable().optional(),
    type: buyerTypeSchema,
    countryIso2: z.string().length(2).toUpperCase(),
    city: z.string().max(120).nullable().optional(),
    address: z.string().max(240).nullable().optional(),
    contactName: z.string().min(2).max(120),
    contactEmail: z.string().email(),
    contactLocale: z.enum(['pt-br', 'en']).optional(),
  }),
  container: z.object({
    code: containerCodeSchema,
    configuredTempC: z.number().nullable().optional(),
  }),
  items: z
    .array(
      z.object({
        productSlug: z.string().min(1),
        // Idem — varietyId pode ser UUID (vem de trpc.catalog.passport) ou fallback.
        varietyId: z.string().min(1),
        qtyBoxes: z.number().int().nonnegative(),
        qtyPallets: z.number().int().nonnegative(),
        totalWeightKg: z.number().nonnegative(),
      }),
    )
    .min(1),
  buyerNote: z.string().max(1200).nullable().optional(),
});

export const proposalRouter = router({
  /**
   * Submete uma proposta a partir do draft client-side.
   * Cria BuyerCompany + User + Proposal + LoadPlan + LoadItems + AuditEvent.
   * Dispara e-mail interno para o time comercial e confirmação ao comprador.
   */
  submit: publicProcedure
    .input(submitInput)
    .mutation(({ input }) => submitProposalFromDraft(input)),

  /**
   * Lista as propostas do BuyerCompany do usuário logado.
   * Resolvido via session.user.id → Buyer → BuyerCompany.id, garantindo que
   * um buyer só vê suas próprias propostas.
   */
  listMine: buyerProcedure.query(({ ctx }) =>
    ctx.repos.proposal.list({ companyIds: [ctx.buyer.companyId] }),
  ),

  /**
   * Detalhe de uma proposta do buyer logado, indexada pela `reference` legível.
   */
  getMine: buyerProcedure
    .input(z.object({ reference: z.string().min(2).max(60) }))
    .query(async ({ ctx, input }) => {
      const detail = await ctx.repos.proposal.findByReference(input.reference);
      if (!detail || detail.buyerCompany.id !== ctx.buyer.companyId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      return detail;
    }),

  /**
   * Re-submete proposta após ADJUSTMENT_REQUESTED.
   * Volta para UNDER_COMMERCIAL_REVIEW, registra ProposalNote (FROM_BUYER) com
   * a mensagem do comprador, e notifica o time interno.
   */
  resubmit: buyerProcedure
    .input(
      z.object({
        reference: z.string().min(2).max(60),
        body: z.string().min(2).max(1200).trim(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.proposal.findUnique({
        where: { reference: input.reference },
        select: {
          id: true,
          buyerCompanyId: true,
          status: true,
          reference: true,
          destinationCountryIso: true,
          buyerCompany: { select: { legalName: true } },
          createdBy: { select: { name: true } },
          loadPlan: {
            select: { containerType: { select: { code: true } }, _count: { select: { items: true } } },
          },
        },
      });
      if (!proposal || proposal.buyerCompanyId !== ctx.buyer.companyId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (proposal.status !== 'ADJUSTMENT_REQUESTED') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Cannot resubmit while status is ${proposal.status}`,
        });
      }

      await applyProposalTransition({
        proposalId: proposal.id,
        fromStatus: 'ADJUSTMENT_REQUESTED',
        toStatus: 'UNDER_COMMERCIAL_REVIEW',
        actorUserId: ctx.buyer.userId,
        actorTeam: null,
        note: { body: input.body, kind: 'FROM_BUYER' },
      });

      // Notifica o time interno que o buyer respondeu.
      try {
        await sendProposalNotification({
          reference: proposal.reference,
          buyerLegalName: proposal.buyerCompany.legalName,
          buyerContactName: proposal.createdBy?.name ?? ctx.buyer.companyLegalName,
          destinationCountryIso2: proposal.destinationCountryIso,
          itemsCount: proposal.loadPlan?._count.items ?? 0,
          containerCode: proposal.loadPlan?.containerType.code ?? '—',
        });
      } catch (err) {
        console.warn('[proposal.resubmit] internal mail failed', err);
      }

      return { ok: true as const };
    }),
});
