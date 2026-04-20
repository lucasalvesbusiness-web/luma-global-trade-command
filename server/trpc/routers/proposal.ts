import { z } from 'zod';

import { submitProposalFromDraft } from '@/server/services/proposal';

import { publicProcedure, router } from '../trpc';

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
   * Dispara e-mail interno para o time comercial (best-effort).
   */
  submit: publicProcedure
    .input(submitInput)
    .mutation(({ input }) => submitProposalFromDraft(input)),
});
