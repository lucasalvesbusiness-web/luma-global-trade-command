import { initTRPC, TRPCError } from '@trpc/server';
import * as Sentry from '@sentry/nextjs';
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
    // 4xx errors (UNAUTHORIZED/FORBIDDEN/NOT_FOUND/BAD_REQUEST/CONFLICT) are
    // expected — don't pollute Sentry. Log only INTERNAL_SERVER_ERROR and
    // unknown causes.
    if (
      !error.code ||
      error.code === 'INTERNAL_SERVER_ERROR' ||
      error.code === 'PARSE_ERROR'
    ) {
      Sentry.captureException(error);
    }
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
 * Procedure que exige usuário com role FIELD_OPERATOR (ou ADMIN para override).
 * Resolve a origem associada via FieldOperator.
 */
export const fieldOperatorProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  const role = ctx.session?.user?.role;
  if (role !== 'FIELD_OPERATOR' && role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Field operator only' });
  }
  const operator = await ctx.db.fieldOperator.findUnique({
    where: { userId },
    include: { origin: true },
  });
  if (!operator && role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Operador sem fazenda atribuída.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      operator: operator
        ? {
            userId,
            operatorId: operator.id,
            originId: operator.originId,
            originSlug: operator.origin.slug,
          }
        : null,
      isAdminOverride: role === 'ADMIN',
    },
  });
});

/**
 * Procedure para um BUYER autenticado, com BuyerCompany aprovada e onboarding
 * concluído. Usada pelas rotas /buyer/* (lista de propostas, detalhe, resubmit).
 *
 * Se a empresa estiver PENDING/REJECTED/BLOCKED ou onboarding incompleto,
 * lança FORBIDDEN — o frontend redireciona para /pending ou /onboarding.
 */
export const buyerProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (ctx.session?.user?.role !== 'BUYER') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Buyer only' });
  }
  const buyer = await ctx.db.buyer.findUnique({
    where: { userId },
    include: { company: { select: { id: true, approvalStatus: true, onboardingCompletedAt: true, legalName: true } } },
  });
  if (!buyer) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Buyer profile missing' });
  }
  if (buyer.company.approvalStatus !== 'APPROVED') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Buyer company is ${buyer.company.approvalStatus}`,
    });
  }
  if (!buyer.company.onboardingCompletedAt) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Onboarding not completed',
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      buyer: {
        userId,
        buyerId: buyer.id,
        companyId: buyer.companyId,
        companyLegalName: buyer.company.legalName,
      },
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
