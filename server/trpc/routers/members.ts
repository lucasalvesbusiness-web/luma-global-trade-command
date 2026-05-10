import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { sendCompanyInvitationEmail } from '@/server/mail/company-invitation';
import { ownerProcedure, protectedProcedure, router } from '@/server/trpc/trpc';

const ROLE_LABELS_PT: Record<string, string> = {
  OWNER: 'Proprietário(a)',
  COMMERCIAL: 'Comercial',
  OPERATIONS: 'Operação',
  FINANCE: 'Financeiro',
};

const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 72h
const INVITE_DAILY_LIMIT = 5;

const memberRoleSchema = z.enum(['OWNER', 'COMMERCIAL', 'OPERATIONS', 'FINANCE']);

export const membersRouter = router({
  list: ownerProcedure.query(async ({ ctx }) => {
    const [members, invitations] = await Promise.all([
      db.companyMember.findMany({
        where: { companyId: ctx.companyId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      db.companyInvitation.findMany({
        where: { companyId: ctx.companyId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        name: m.user.name,
        email: m.user.email,
        createdAt: m.createdAt,
      })),
      invitations: invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      })),
    };
  }),

  invite: ownerProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: memberRoleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase().trim();

      // Rate limit: 5 invitations / day / company.
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await db.companyInvitation.count({
        where: { companyId: ctx.companyId, createdAt: { gte: dayAgo } },
      });
      if (recentCount >= INVITE_DAILY_LIMIT) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Limite de ${INVITE_DAILY_LIMIT} convites por dia atingido.`,
        });
      }

      // Already a member?
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        const existingMember = await db.companyMember.findFirst({
          where: { userId: existingUser.id, companyId: ctx.companyId },
        });
        if (existingMember) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Este email já é membro da empresa.',
          });
        }
      }

      // Already pending invite for same email?
      const existingInvite = await db.companyInvitation.findFirst({
        where: { companyId: ctx.companyId, email, status: 'PENDING' },
      });
      if (existingInvite) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Já existe um convite pendente para este email.',
        });
      }

      const token = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

      const invitation = await db.companyInvitation.create({
        data: {
          companyId: ctx.companyId,
          email,
          role: input.role,
          token,
          invitedById: ctx.user.id,
          expiresAt,
        },
      });

      await db.auditEvent.create({
        data: {
          entityType: 'CompanyInvitation',
          entityId: invitation.id,
          action: 'INVITATION_SENT',
          actorId: ctx.user.id,
          diffJson: { companyId: ctx.companyId, email, role: input.role },
        },
      });

      const company = await db.company.findUnique({
        where: { id: ctx.companyId },
        select: { tradeName: true, legalName: true },
      });
      const inviter = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true, email: true },
      });

      await sendCompanyInvitationEmail({
        to: email,
        inviterName: inviter?.name ?? inviter?.email ?? 'Alguém',
        companyName: company?.tradeName ?? company?.legalName ?? 'a empresa',
        roleLabel: ROLE_LABELS_PT[input.role] ?? input.role,
        token,
      }).catch(() => {
        // Email best-effort; invitation row stays valid.
      });

      return { id: invitation.id };
    }),

  revoke: ownerProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await db.companyInvitation.findUnique({
        where: { id: input.invitationId },
      });
      if (!inv || inv.companyId !== ctx.companyId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (inv.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Convite não está mais pendente.',
        });
      }
      await db.companyInvitation.update({
        where: { id: input.invitationId },
        data: { status: 'REVOKED', revokedAt: new Date() },
      });
      return { ok: true };
    }),

  removeMember: ownerProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await db.companyMember.findUnique({
        where: { id: input.memberId },
      });
      if (!member || member.companyId !== ctx.companyId) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      if (member.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você não pode remover a si mesmo.',
        });
      }
      // Prevent removing the last OWNER.
      if (member.role === 'OWNER') {
        const ownerCount = await db.companyMember.count({
          where: { companyId: ctx.companyId, role: 'OWNER' },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível remover o último proprietário.',
          });
        }
      }
      await db.companyMember.delete({ where: { id: input.memberId } });
      return { ok: true };
    }),

  /**
   * Public: validate a token and return preview info. Does NOT consume.
   */
  preview: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return previewInvitation(input.token);
    }),

  acceptByToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await db.companyInvitation.findUnique({
        where: { token: input.token },
      });
      if (!inv) throw new TRPCError({ code: 'NOT_FOUND', message: 'Convite inválido.' });
      if (inv.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este convite não está mais válido.',
        });
      }
      if (new Date(inv.expiresAt) < new Date()) {
        await db.companyInvitation.update({
          where: { id: inv.id },
          data: { status: 'EXPIRED' },
        });
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Convite expirado.' });
      }

      // Email of invited must match the logged user.
      const dbUser = await db.user.findUnique({ where: { id: ctx.user.id } });
      if (!dbUser || dbUser.email.toLowerCase() !== inv.email.toLowerCase()) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Faça login com o email para o qual o convite foi enviado.',
        });
      }

      // Already member?
      const existing = await db.companyMember.findFirst({
        where: { userId: ctx.user.id, companyId: inv.companyId },
      });
      if (existing) {
        // idempotent: mark accepted, return ok.
        await db.companyInvitation.update({
          where: { id: inv.id },
          data: { status: 'ACCEPTED', acceptedAt: new Date() },
        });
        return { ok: true, companyId: inv.companyId };
      }

      await db.companyMember.create({
        data: {
          userId: ctx.user.id,
          companyId: inv.companyId,
          role: inv.role,
        },
      });
      await db.companyInvitation.update({
        where: { id: inv.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      await db.auditEvent.create({
        data: {
          entityType: 'CompanyInvitation',
          entityId: inv.id,
          action: 'INVITATION_ACCEPTED',
          actorId: ctx.user.id,
        },
      });

      return { ok: true, companyId: inv.companyId };
    }),
});

export async function previewInvitation(token: string) {
  const inv = await db.companyInvitation.findUnique({
    where: { token },
    include: {
      company: { select: { slug: true, tradeName: true, legalName: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });
  if (!inv) return null;
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    expired: new Date(inv.expiresAt) < new Date(),
    company: inv.company,
    inviter: inv.invitedBy,
  };
}
