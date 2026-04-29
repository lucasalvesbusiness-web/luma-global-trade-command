import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import type { Session } from 'next-auth';
import { auth } from '@/server/auth/config';
import { db } from '@/lib/db';
import { repositories, type Repositories } from '@/server/repositories';

export type TrpcContext = {
  db: typeof db;
  session: Session | null;
  repos: Repositories;
};

export async function createContext(): Promise<TrpcContext> {
  const session = await auth();
  return { db, session, repos: repositories };
}

const t = initTRPC.context<TrpcContext>().create({
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

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/**
 * Procedure que exige usuário com role ADMIN. Usada pelas rotas do Admin Console.
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (ctx.session?.user?.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      admin: { userId },
    },
  });
});

/**
 * Procedure que exige usuário autenticado com role STAFF ou ADMIN.
 * Usada pelas rotas do Internal Control View.
 */
export const staffProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  const role = ctx.session?.user?.role;
  if (role !== 'STAFF' && role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff only' });
  }
  // Busca o staff member para obter o team
  const staff = await ctx.db.staffMember.findUnique({ where: { userId } });
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      staff: {
        userId,
        team: staff?.team ?? (role === 'ADMIN' ? 'ADMIN' : null),
        title: staff?.title ?? null,
      },
    },
  });
});
