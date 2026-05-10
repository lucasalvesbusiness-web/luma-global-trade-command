import type { PrismaClient, VerificationStatus } from '@prisma/client';

import type {
  CompanyRepository,
  CompanyWithRelations,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '@/server/repositories/interfaces';

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function createPrismaCompanyRepository(db: PrismaClient): CompanyRepository {
  async function uniqueSlug(seed: string): Promise<string> {
    const base = slugify(seed) || 'empresa';
    let candidate = base;
    let counter = 2;
    while (await db.company.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      candidate = `${base}-${counter++}`;
    }
    return candidate;
  }

  return {
    async findById(id) {
      return db.company.findUnique({
        where: { id },
        include: { members: true, offerings: true },
      }) as Promise<CompanyWithRelations | null>;
    },

    async findBySlug(slug) {
      return db.company.findUnique({
        where: { slug },
        include: { members: true, offerings: true },
      }) as Promise<CompanyWithRelations | null>;
    },

    async findByTaxId(taxId) {
      return db.company.findUnique({ where: { taxId } });
    },

    async create(input: CreateCompanyInput) {
      const slug = await uniqueSlug(input.tradeName ?? input.legalName);
      const created = await db.company.create({
        data: {
          slug,
          legalName: input.legalName,
          tradeName: input.tradeName,
          taxId: input.taxId,
          description: input.description,
          city: input.city,
          state: input.state,
          latitude: input.latitude,
          longitude: input.longitude,
          serviceRadiusKm: input.serviceRadiusKm,
          members: {
            create: { userId: input.ownerUserId, role: 'OWNER' },
          },
          offerings: {
            create: input.offerings.map((o) => ({
              category: o.category,
              subcategory: o.subcategory,
              modality: o.modality,
              description: o.description,
            })),
          },
        },
        include: { members: true, offerings: true },
      });
      await db.auditEvent.create({
        data: {
          entityType: 'Company',
          entityId: created.id,
          action: 'CREATED',
          actorId: input.ownerUserId,
          toStatus: created.verificationStatus,
        },
      });
      return created as CompanyWithRelations;
    },

    async update(id, input: UpdateCompanyInput) {
      return db.company.update({
        where: { id },
        data: input,
      });
    },

    async setVerificationStatus(id, status: VerificationStatus) {
      const before = await db.company.findUnique({
        where: { id },
        select: { verificationStatus: true },
      });
      const updated = await db.company.update({
        where: { id },
        data: { verificationStatus: status },
      });
      await db.auditEvent.create({
        data: {
          entityType: 'Company',
          entityId: id,
          action: 'VERIFICATION_STATUS_CHANGED',
          fromStatus: before?.verificationStatus,
          toStatus: status,
        },
      });
      return updated;
    },

    async listForUser(userId) {
      const members = await db.companyMember.findMany({
        where: { userId },
        include: { company: true },
        orderBy: { createdAt: 'asc' },
      });
      return members.map((m) => ({ company: m.company, role: m.role }));
    },
  };
}
