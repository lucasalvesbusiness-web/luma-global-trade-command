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
