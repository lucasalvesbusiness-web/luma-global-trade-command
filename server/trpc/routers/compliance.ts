import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

export const complianceRouter = router({
  /** Preview documental para um par (produto × país). */
  previewFor: publicProcedure
    .input(
      z.object({
        productSlug: z.string().min(1),
        countryIso2: z.string().length(2).toUpperCase(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.repos.compliance.previewFor(input.productSlug, input.countryIso2),
    ),

  /** Todos os previews para um país (usado em listagem por destino). */
  previewsForCountry: publicProcedure
    .input(z.object({ countryIso2: z.string().length(2).toUpperCase() }))
    .query(({ ctx, input }) => ctx.repos.compliance.previewsForCountry(input.countryIso2)),
});
