import type {
  DealRoom,
  DealRoomStatus,
  DealTemplate,
  DeliveryCycle,
  Evidence,
  EvidenceKind,
  PrismaClient,
} from '@prisma/client';

export type DealRoomWithRelations = DealRoom & {
  buyerCompany: { id: string; slug: string; legalName: string; tradeName: string | null };
  supplierCompany: { id: string; slug: string; legalName: string; tradeName: string | null };
  evidences: Evidence[];
  cycles: DeliveryCycle[];
};

export function createPrismaDealRoomRepository(db: PrismaClient) {
  return {
    async create(input: {
      buyerCompanyId: string;
      supplierCompanyId: string;
      template: DealTemplate;
      title: string;
      scopePayload?: unknown;
      actorUserId: string;
    }): Promise<DealRoomWithRelations> {
      const created = await db.dealRoom.create({
        data: {
          buyerCompanyId: input.buyerCompanyId,
          supplierCompanyId: input.supplierCompanyId,
          template: input.template,
          title: input.title,
          scopePayload: input.scopePayload as never,
        },
        include: companyRelations,
      });
      await db.auditEvent.create({
        data: {
          entityType: 'DealRoom',
          entityId: created.id,
          action: 'OPENED',
          actorId: input.actorUserId,
          toStatus: created.status,
        },
      });
      return created as DealRoomWithRelations;
    },

    async findById(id: string): Promise<DealRoomWithRelations | null> {
      return db.dealRoom.findUnique({
        where: { id },
        include: companyRelations,
      }) as Promise<DealRoomWithRelations | null>;
    },

    async listForCompany(companyId: string) {
      return db.dealRoom.findMany({
        where: {
          OR: [{ buyerCompanyId: companyId }, { supplierCompanyId: companyId }],
        },
        include: companyRelations,
        orderBy: { updatedAt: 'desc' },
      });
    },

    async transition(input: {
      dealRoomId: string;
      from: DealRoomStatus;
      to: DealRoomStatus;
      action: string;
      actorUserId: string;
      patch?: {
        scopePayload?: unknown;
        quoteCents?: number;
        quoteCurrency?: string;
        title?: string;
      };
    }) {
      const timestamps = {
        ACCEPTED: { acceptedAt: new Date() },
        DELIVERED: { deliveredAt: new Date() },
        CONFIRMED: { confirmedAt: new Date() },
        CLOSED: { closedAt: new Date() },
        DISPUTED: { disputedAt: new Date() },
        CANCELLED: { cancelledAt: new Date() },
      } as const;
      const tsPatch = (timestamps as Record<string, object>)[input.to] ?? {};

      const updated = await db.dealRoom.update({
        where: { id: input.dealRoomId },
        data: {
          status: input.to,
          ...tsPatch,
          ...(input.patch?.scopePayload !== undefined
            ? { scopePayload: input.patch.scopePayload as never }
            : {}),
          ...(input.patch?.quoteCents !== undefined
            ? { quoteCents: input.patch.quoteCents }
            : {}),
          ...(input.patch?.quoteCurrency !== undefined
            ? { quoteCurrency: input.patch.quoteCurrency }
            : {}),
          ...(input.patch?.title !== undefined ? { title: input.patch.title } : {}),
        },
        include: companyRelations,
      });
      await db.auditEvent.create({
        data: {
          entityType: 'DealRoom',
          entityId: input.dealRoomId,
          action: input.action,
          actorId: input.actorUserId,
          fromStatus: input.from,
          toStatus: input.to,
        },
      });
      return updated as DealRoomWithRelations;
    },

    async attachEvidence(input: {
      dealRoomId: string;
      cycleId?: string;
      kind: EvidenceKind;
      url: string;
      caption?: string;
      uploadedById: string;
    }) {
      const ev = await db.evidence.create({
        data: {
          dealRoomId: input.dealRoomId,
          cycleId: input.cycleId,
          kind: input.kind,
          url: input.url,
          caption: input.caption,
          uploadedById: input.uploadedById,
        },
      });
      await db.auditEvent.create({
        data: {
          entityType: 'Evidence',
          entityId: ev.id,
          action: 'EVIDENCE_UPLOADED',
          actorId: input.uploadedById,
          diffJson: { dealRoomId: input.dealRoomId, kind: input.kind },
        },
      });
      return ev;
    },

    async acceptEvidence(input: { evidenceId: string; acceptedById: string }) {
      const ev = await db.evidence.update({
        where: { id: input.evidenceId },
        data: { acceptedById: input.acceptedById, acceptedAt: new Date() },
      });
      await db.auditEvent.create({
        data: {
          entityType: 'Evidence',
          entityId: ev.id,
          action: 'EVIDENCE_ACCEPTED',
          actorId: input.acceptedById,
        },
      });
      return ev;
    },

    async listAuditEvents(dealRoomId: string) {
      return db.auditEvent.findMany({
        where: {
          OR: [
            { entityType: 'DealRoom', entityId: dealRoomId },
            // Evidence events keyed by evidenceId; fetch via a join below.
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
    },
  };
}

const companyRelations = {
  buyerCompany: { select: { id: true, slug: true, legalName: true, tradeName: true } },
  supplierCompany: { select: { id: true, slug: true, legalName: true, tradeName: true } },
  evidences: { orderBy: { createdAt: 'asc' as const } },
  cycles: { orderBy: { ordinal: 'asc' as const } },
};
