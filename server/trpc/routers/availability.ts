import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

const availabilityStatusSchema = z.enum([
  'AVAILABLE_NOW',
  'PRE_RESERVE_OPEN',
  'UNDER_TECHNICAL_VALIDATION',
  'LIMITED_AVAILABILITY',
  'UNDER_CONSULTATION',
  'NOT_AVAILABLE_FOR_DESTINATION',
]);

export const availabilityRouter = router({
  /** Lista disponibilidades; opcionalmente filtra por produto ou status. */
  list: publicProcedure
    .input(
      z
        .object({
          productSlug: z.string().min(1).optional(),
          statuses: z.array(availabilityStatusSchema).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const opts = input?.statuses ? { statuses: input.statuses } : undefined;
      if (input?.productSlug) {
        return ctx.repos.availability.listForProduct(input.productSlug, opts);
      }
      return ctx.repos.availability.listAll(opts);
    }),

  /** Janelas de colheita projetadas por produto. */
  harvestWindowsForProduct: publicProcedure
    .input(z.object({ productSlug: z.string().min(1) }))
    .query(({ ctx, input }) =>
      ctx.repos.availability.harvestWindowsForProduct(input.productSlug),
    ),
});
