import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { auth } from '@/server/auth/config';
import { repositories } from '@/server/repositories';

export async function createTRPCContext() {
  const session = await auth();
  return {
    session,
    user: session?.user ?? null,
    repositories,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.platformRole !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
  }
  return next({ ctx });
});

export const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.companyId || ctx.user.companyRole !== 'OWNER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Owner only' });
  }
  return next({ ctx: { ...ctx, companyId: ctx.user.companyId } });
});
