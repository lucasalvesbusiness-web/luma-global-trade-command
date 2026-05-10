import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Nodemailer from 'next-auth/providers/nodemailer';

import { db } from '@/lib/db';
import type {
  CompanyMemberRole,
  UserRole,
  VerificationStatus,
} from '@/lib/types/enums';
import { sendMagicLinkEmail } from '@/server/mail/magic-link';
import { mailFrom } from '@/server/mail/transport';

export const authConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  pages: {
    signIn: '/auth/sign-in',
    verifyRequest: '/auth/verify',
  },
  providers: [
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST ?? 'localhost',
        port: Number(process.env.SMTP_PORT ?? 1025),
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASSWORD
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
      },
      from: mailFrom,
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLinkEmail({ to: identifier, url });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const member = await db.companyMember.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          include: { company: { select: { slug: true, verificationStatus: true } } },
        });
        if (member) {
          session.user.companyId = member.companyId;
          session.user.companyRole = member.role as CompanyMemberRole;
          session.user.companySlug = member.company.slug;
          session.user.companyVerification = member.company.verificationStatus as VerificationStatus;
        }
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        if (dbUser) session.user.platformRole = dbUser.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
