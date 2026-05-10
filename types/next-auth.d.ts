import type { CompanyMemberRole, UserRole, VerificationStatus } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      companyId?: string;
      companyRole?: CompanyMemberRole;
      companySlug?: string;
      companyVerification?: VerificationStatus;
      platformRole?: UserRole;
    } & DefaultSession['user'];
  }
}
