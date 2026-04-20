import NextAuth, { type NextAuthConfig } from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';

import { db } from '@/lib/db';

const smtpHost = process.env.SMTP_HOST ?? 'localhost';
const smtpPort = Number(process.env.SMTP_PORT ?? 1025);
const smtpFrom = process.env.SMTP_FROM ?? 'Luma <no-reply@luma.local>';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: 'database' },
  providers: [
    Nodemailer({
      server: {
        host: smtpHost,
        port: smtpPort,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASSWORD
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
      },
      from: smtpFrom,
    }),
  ],
  pages: {
    signIn: '/auth/sign-in',
    verifyRequest: '/auth/verify',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
