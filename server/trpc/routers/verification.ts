import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  adminProcedure,
  ownerProcedure,
  router,
} from '@/server/trpc/trpc';

export const verificationRouter = router({
  uploadArtifact: ownerProcedure
    .input(
      z.object({
        kind: z.enum(['TAX_ID_CARD', 'ADDRESS_PROOF', 'OTHER']),
        url: z.string().url(),
        hash: z.string().optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.repositories.verificationArtifact.create({
        ...input,
        companyId: ctx.companyId,
        uploadedById: ctx.user.id,
      }),
    ),

  listPending: adminProcedure.query(({ ctx }) =>
    ctx.repositories.verificationArtifact.listPending(),
  ),

  review: adminProcedure
    .input(
      z.object({
        artifactId: z.string(),
        status: z.enum(['APPROVED', 'REJECTED']),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const artifact = await ctx.repositories.verificationArtifact.findById(
        input.artifactId,
      );
      if (!artifact) throw new TRPCError({ code: 'NOT_FOUND' });

      const updated = await ctx.repositories.verificationArtifact.setStatus(
        input.artifactId,
        input.status,
        ctx.user.id,
        input.notes,
      );

      if (input.status === 'APPROVED') {
        await ctx.repositories.company.setVerificationStatus(
          artifact.companyId,
          'DOC_VERIFIED',
        );
      }

      return updated;
    }),
});
