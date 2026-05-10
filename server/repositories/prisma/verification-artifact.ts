import type { PrismaClient, VerificationArtifactStatus } from '@prisma/client';

import type {
  CreateArtifactInput,
  VerificationArtifactRepository,
} from '@/server/repositories/interfaces';

export function createPrismaVerificationArtifactRepository(
  db: PrismaClient,
): VerificationArtifactRepository {
  return {
    async create(input: CreateArtifactInput) {
      return db.verificationArtifact.create({
        data: {
          companyId: input.companyId,
          kind: input.kind,
          url: input.url,
          hash: input.hash,
          notes: input.notes,
          uploadedById: input.uploadedById,
        },
      });
    },

    async listPending() {
      return db.verificationArtifact.findMany({
        where: { status: 'PENDING' },
        include: { company: true },
        orderBy: { createdAt: 'asc' },
      });
    },

    async findById(id) {
      return db.verificationArtifact.findUnique({ where: { id } });
    },

    async setStatus(id, status: VerificationArtifactStatus, reviewedById, notes) {
      return db.verificationArtifact.update({
        where: { id },
        data: {
          status,
          reviewedById,
          reviewedAt: new Date(),
          notes,
        },
      });
    },
  };
}
