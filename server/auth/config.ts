import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { db } from '@/lib/db';
import type {
  CompanyMemberRole,
  UserRole,
  VerificationStatus,
} from '@/lib/types/enums';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig = {
  // JWT strategy is required when using CredentialsProvider.
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/sign-in',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, embed user.id into the token.
      if (user) {
        token.sub = user.id;
      }

      // Hydrate company info on sign-in or when a refresh is requested.
      if (token.sub && (user || trigger === 'update' || !token.companyId)) {
        const member = await db.companyMember.findFirst({
          where: { userId: token.sub },
          orderBy: { createdAt: 'asc' },
          include: {
            company: { select: { slug: true, verificationStatus: true } },
          },
        });
        if (member) {
          token.companyId = member.companyId;
          token.companyRole = member.role;
          token.companySlug = member.company.slug;
          token.companyVerification = member.company.verificationStatus;
        } else {
          token.companyId = undefined;
          token.companyRole = undefined;
          token.companySlug = undefined;
          token.companyVerification = undefined;
        }
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.platformRole = dbUser?.role ?? 'MEMBER';
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.companyId = token.companyId as string | undefined;
        session.user.companyRole = token.companyRole as CompanyMemberRole | undefined;
        session.user.companySlug = token.companySlug as string | undefined;
        session.user.companyVerification = token.companyVerification as
          | VerificationStatus
          | undefined;
        session.user.platformRole = token.platformRole as UserRole | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
