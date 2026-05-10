import { db } from '@/lib/db';

import { createPrismaCompanyRepository } from './prisma/company';
import { createPrismaVerificationArtifactRepository } from './prisma/verification-artifact';

export const repositories = {
  company: createPrismaCompanyRepository(db),
  verificationArtifact: createPrismaVerificationArtifactRepository(db),
};
