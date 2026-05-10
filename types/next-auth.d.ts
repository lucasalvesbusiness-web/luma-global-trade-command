import type { DefaultSession } from 'next-auth';

import type { CompanyMemberRole, UserRole, VerificationStatus } from '@/lib/types/enums';

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
