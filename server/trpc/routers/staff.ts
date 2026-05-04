import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { adminProcedure, router } from '../trpc';
import { sendStaffInvite } from '@/server/mail/staff-invite';

const teamSchema = z.enum(['COMMERCIAL', 'OPERATIONS', 'COMPLIANCE', 'ADMIN']);
const roleSchema = z.enum(['STAFF', 'ADMIN']);

export const staffRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const staff = await ctx.db.staffMember.findMany({
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return staff.map((s) => ({
      id: s.id,
      userId: s.user.id,
      email: s.user.email,
      name: s.user.name,
      role: s.user.role,
      team: s.team,
      title: s.title,
      createdAt: s.createdAt,
      lastLoginAt: s.user.emailVerified,
    }));
  }),

  invite: adminProcedure
    .input(
      z.object({
        email: z.string().email().toLowerCase().trim(),
        name: z.string().min(2).max(120).trim(),
        role: roleSchema,
        team: teamSchema,
        title: z.string().max(120).trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        include: { staff: true, buyer: true },
      });

      if (existing?.staff) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este e-mail já é membro do time.',
        });
      }
      if (existing?.buyer) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este e-mail já está cadastrado como comprador.',
        });
      }

      const user =
        existing ??
        (await ctx.db.user.create({
          data: {
            email: input.email,
            name: input.name,
            role: input.role,
          },
        }));

      if (existing && existing.role !== input.role) {
        await ctx.db.user.update({
          where: { id: user.id },
          data: { role: input.role, name: input.name },
        });
      }

      const staff = await ctx.db.staffMember.create({
        data: {
          userId: user.id,
          team: input.team,
          title: input.title,
        },
      });

      await ctx.db.auditEvent.create({
        data: {
          entity: 'StaffMember',
          entityId: staff.id,
          actorId: ctx.admin.userId,
          toStatus: 'INVITED',
          diffJson: {
            email: input.email,
            role: input.role,
            team: input.team,
            title: input.title ?? null,
          },
        },
      });

      const inviter = await ctx.db.user.findUnique({
        where: { id: ctx.admin.userId },
        select: { name: true, email: true },
      });

      const baseUrl =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';

      try {
        await sendStaffInvite({
          to: input.email,
          inviteeName: input.name,
          role: input.role,
          team: input.team,
          inviterName: inviter?.name ?? inviter?.email ?? 'Equipe Luma',
          baseUrl,
        });
      } catch (err) {
        console.error('[staff.invite] falha ao enviar e-mail', err);
      }

      return { staffId: staff.id, userId: user.id };
    }),

  update: adminProcedure
    .input(
      z.object({
        staffId: z.string().uuid(),
        role: roleSchema.optional(),
        team: teamSchema.optional(),
        title: z.string().max(120).trim().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const staff = await ctx.db.staffMember.findUnique({
        where: { id: input.staffId },
        include: { user: true },
      });
      if (!staff) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (input.role && input.role !== staff.user.role) {
        if (staff.user.role === 'ADMIN' && input.role !== 'ADMIN') {
          const adminCount = await ctx.db.user.count({
            where: { role: 'ADMIN' },
          });
          if (adminCount <= 1) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Não é possível remover o último administrador.',
            });
          }
        }
        await ctx.db.user.update({
          where: { id: staff.userId },
          data: { role: input.role },
        });
      }

      if (input.team !== undefined || input.title !== undefined) {
        await ctx.db.staffMember.update({
          where: { id: input.staffId },
          data: {
            ...(input.team !== undefined && { team: input.team }),
            ...(input.title !== undefined && { title: input.title }),
          },
        });
      }

      return { ok: true };
    }),

  remove: adminProcedure
    .input(z.object({ staffId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const staff = await ctx.db.staffMember.findUnique({
        where: { id: input.staffId },
        include: { user: true },
      });
      if (!staff) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (staff.userId === ctx.admin.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Você não pode remover sua própria conta.',
        });
      }

      if (staff.user.role === 'ADMIN') {
        const adminCount = await ctx.db.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Não é possível remover o último administrador.',
          });
        }
      }

      await ctx.db.staffMember.delete({ where: { id: input.staffId } });
      await ctx.db.user.update({
        where: { id: staff.userId },
        data: { role: 'BUYER' },
      });

      return { ok: true };
    }),
});
