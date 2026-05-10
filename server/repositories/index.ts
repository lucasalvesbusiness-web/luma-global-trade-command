import { db } from '@/lib/db';

import { createPrismaCompanyRepository } from './prisma/company';
import { createPrismaDealRoomRepository } from './prisma/deal-room';
import { createPrismaVerificationArtifactRepository } from './prisma/verification-artifact';

export const repositories = {
  company: createPrismaCompanyRepository(db),
  dealRoom: createPrismaDealRoomRepository(db),
  verificationArtifact: createPrismaVerificationArtifactRepository(db),
};
