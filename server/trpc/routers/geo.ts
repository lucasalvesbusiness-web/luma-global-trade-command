import { z } from 'zod';

import { publicProcedure, router } from '../trpc';

export const geoRouter = router({
  /** Lista países seed. */
  countries: publicProcedure.query(({ ctx }) => ctx.repos.geo.listCountries()),

  /** Portos filtrados por país (ISO-2). */
  portsByCountry: publicProcedure
    .input(z.object({ iso2: z.string().length(2).toUpperCase() }))
    .query(({ ctx, input }) => ctx.repos.geo.portsByCountry(input.iso2)),

  /** Origens Luma (fazendas, parceiros auditados, unidade agroindustrial). */
  origins: publicProcedure.query(({ ctx }) => ctx.repos.geo.listOrigins()),
});
