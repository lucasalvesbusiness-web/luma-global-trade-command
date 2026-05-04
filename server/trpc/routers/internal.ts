import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  allowedNextStatuses,
  isTransitionAllowed,
} from '@/server/services/proposal-workflow';
import { applyProposalTransition } from '@/server/services/proposal-transitions';
import type { StaffTeam } from '@/server/repositories/types';

import { router, staffProcedure } from '../trpc';

const proposalStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_COMMERCIAL_REVIEW',
  'UNDER_OPERATIONAL_REVIEW',
  'DOCUMENTATION_REVIEW_REQUIRED',
  'ADJUSTMENT_REQUESTED',
  'APPROVED_FOR_NEGOTIATION',
  'REJECTED',
  'CONVERTED_TO_OPERATION',
]);

const noteKindSchema = z.enum(['INTERNAL', 'TO_BUYER']);

export const internalRouter = router({
  /** Lista todas as propostas (com includes básicos). */
  listProposals: staffProcedure
    .input(
      z
        .object({
          statuses: z.array(proposalStatusSchema).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      ctx.repos.proposal.list(
        input?.statuses ? { statuses: input.statuses } : undefined,
      ),
    ),

  /** Detalhe completo da proposta + notes + audit trail. */
  proposalDetail: staffProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => ctx.repos.proposal.findById(input.id)),

  /** Próximas transições permitidas para o time atual. */
  allowedTransitions: staffProcedure
    .input(z.object({ fromStatus: proposalStatusSchema }))
    .query(({ ctx, input }) => {
      const team = (ctx.staff.team ?? null) as StaffTeam | null;
      return allowedNextStatuses(input.fromStatus, team);
    }),

  /** Transiciona status + cria AuditEvent + nota opcional. */
  transitionStatus: staffProcedure
    .input(
      z.object({
        proposalId: z.string().uuid(),
        fromStatus: proposalStatusSchema,
        toStatus: proposalStatusSchema,
        note: z
          .object({
            body: z.string().min(1).max(1200),
            kind: noteKindSchema,
          })
          .nullable()
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = (ctx.staff.team ?? null) as StaffTeam | null;

      if (!isTransitionAllowed(input.fromStatus, input.toStatus, team)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Transition not allowed for your team',
        });
      }

      // Garante que fromStatus no banco ainda bate (evita race condition)
      const current = await ctx.db.proposal.findUnique({
        where: { id: input.proposalId },
        select: { status: true },
      });
      if (!current) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (current.status !== input.fromStatus) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Proposal status changed to ${current.status}`,
        });
      }

      await applyProposalTransition({
        proposalId: input.proposalId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        actorUserId: ctx.staff.userId,
        actorTeam: team,
        note: input.note ?? null,
      });

      return { ok: true as const };
    }),

  /** Adiciona nota (sem mudar status). */
  addNote: staffProcedure
    .input(
      z.object({
        proposalId: z.string().uuid(),
        body: z.string().min(1).max(1200),
        kind: noteKindSchema,
      }),
    )
    .mutation(({ ctx, input }) => {
      const team = (ctx.staff.team ?? null) as StaffTeam | null;
      return ctx.repos.proposal.addNote({
        proposalId: input.proposalId,
        authorUserId: ctx.staff.userId,
        authorTeam: team,
        body: input.body,
        kind: input.kind,
      });
    }),
});
