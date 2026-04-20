import { z } from 'zod';

import { loadProductPassport } from '@/server/services/passport';

import { publicProcedure, router } from '../trpc';

export const catalogRouter = router({
  /** Lista todos os produtos seed com resumo técnico. */
  list: publicProcedure.query(({ ctx }) => ctx.repos.catalog.listProducts()),

  /** Produto completo (com variedades) por slug. */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.repos.catalog.findProductBySlug(input.slug)),

  /** Produtos de uma categoria. */
  byCategory: publicProcedure
    .input(z.object({ categorySlug: z.string().min(1) }))
    .query(({ ctx, input }) => ctx.repos.catalog.listByCategory(input.categorySlug)),

  /**
   * Dados agregados para o Product Passport (produto + variedades +
   * availabilities + harvest windows + últimos field updates das origens).
   * Uma única chamada, zero round trips no cliente.
   */
  passport: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(({ ctx, input }) => loadProductPassport(input.slug, ctx.repos)),
});
