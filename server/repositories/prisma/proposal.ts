import type {
  PrismaClient,
  ProposalStatus as PrismaProposalStatus,
} from '@prisma/client';

import type { ProposalRepository } from '../interfaces';
import type {
  ProposalDetail,
  ProposalListItem,
  ProposalNoteKind,
  ProposalNoteSummary,
  ProposalStatus,
  StaffTeam,
} from '../types';

export function makePrismaProposalRepository(db: PrismaClient): ProposalRepository {
  return {
    async list(opts): Promise<ProposalListItem[]> {
      const rows = await db.proposal.findMany({
        where: opts?.statuses
          ? { status: { in: opts.statuses as PrismaProposalStatus[] } }
          : undefined,
        include: {
          buyerCompany: true,
          destinationCountry: true,
          destinationPort: true,
          loadPlan: { include: { containerType: true, items: true } },
        },
        orderBy: { submittedAt: 'desc' },
      });

      return rows.map((row) => {
        const lp = row.loadPlan;
        const totalBoxes = lp?.items.reduce((s, it) => s + it.qtyBoxes, 0) ?? 0;
        const totalPallets = lp?.items.reduce((s, it) => s + it.qtyPallets, 0) ?? 0;
        const totalWeightKg = lp?.items.reduce((s, it) => s + it.totalWeightKg, 0) ?? 0;
        return {
          id: row.id,
          reference: row.reference,
          status: row.status as ProposalStatus,
          incoterm: row.incoterm,
          submittedAt: row.submittedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          buyerCompany: {
            id: row.buyerCompany.id,
            legalName: row.buyerCompany.legalName,
            displayName: row.buyerCompany.displayName,
            countryIso2: row.buyerCompany.countryIso2,
            type: row.buyerCompany.type,
          },
          destinationCountry: {
            iso2: row.destinationCountry.iso2,
            name: row.destinationCountry.name,
          },
          destinationPort: row.destinationPort
            ? {
                id: row.destinationPort.id,
                name: row.destinationPort.name,
                code: row.destinationPort.code,
              }
            : null,
          loadPlan: lp
            ? {
                containerCode: lp.containerType.code,
                configuredTempC: lp.configuredTempC,
                itemsCount: lp.items.length,
                totalBoxes,
                totalPallets,
                totalWeightKg,
              }
            : null,
        };
      });
    },

    async findById(id): Promise<ProposalDetail | null> {
      const row = await db.proposal.findUnique({
        where: { id },
        include: {
          buyerCompany: true,
          destinationCountry: true,
          destinationPort: true,
          createdBy: true,
          loadPlan: {
            include: {
              containerType: true,
              items: { include: { product: true, variety: true } },
            },
          },
          notes: {
            include: { author: true },
            orderBy: { createdAt: 'desc' },
          },
          auditEvents: {
            include: { actor: true },
            orderBy: { occurredAt: 'desc' },
          },
        },
      });
      if (!row) return null;

      const lp = row.loadPlan;
      const totalBoxes = lp?.items.reduce((s, it) => s + it.qtyBoxes, 0) ?? 0;
      const totalPallets = lp?.items.reduce((s, it) => s + it.qtyPallets, 0) ?? 0;
      const totalWeightKg = lp?.items.reduce((s, it) => s + it.totalWeightKg, 0) ?? 0;

      return {
        id: row.id,
        reference: row.reference,
        status: row.status as ProposalStatus,
        incoterm: row.incoterm,
        submittedAt: row.submittedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        buyerCompany: {
          id: row.buyerCompany.id,
          legalName: row.buyerCompany.legalName,
          displayName: row.buyerCompany.displayName,
          countryIso2: row.buyerCompany.countryIso2,
          type: row.buyerCompany.type,
        },
        destinationCountry: {
          iso2: row.destinationCountry.iso2,
          name: row.destinationCountry.name,
        },
        destinationPort: row.destinationPort
          ? {
              id: row.destinationPort.id,
              name: row.destinationPort.name,
              code: row.destinationPort.code,
            }
          : null,
        loadPlan: lp
          ? {
              containerCode: lp.containerType.code,
              configuredTempC: lp.configuredTempC,
              itemsCount: lp.items.length,
              totalBoxes,
              totalPallets,
              totalWeightKg,
            }
          : null,
        buyerContactEmail: row.createdBy?.email ?? null,
        buyerContactName: row.createdBy?.name ?? null,
        buyerCity: row.buyerCompany.city,
        buyerAddress: row.buyerCompany.address,
        items:
          lp?.items.map((it) => ({
            id: it.id,
            productSlug: it.product.slug,
            productName: it.product.name,
            varietyName: it.variety?.name ?? null,
            qtyBoxes: it.qtyBoxes,
            qtyPallets: it.qtyPallets,
            totalWeightKg: it.totalWeightKg,
          })) ?? [],
        notes: row.notes.map((n) => ({
          id: n.id,
          authorName: n.author?.name ?? null,
          authorEmail: n.author?.email ?? '',
          team: (n.team ?? null) as StaffTeam | null,
          kind: n.kind as ProposalNoteKind,
          body: n.body,
          createdAt: n.createdAt,
        })),
        auditTrail: row.auditEvents.map((e) => ({
          id: e.id,
          actorName: e.actor?.name ?? null,
          actorEmail: e.actor?.email ?? null,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          occurredAt: e.occurredAt,
        })),
      };
    },

    async updateStatus(input) {
      await db.$transaction(async (tx) => {
        await tx.proposal.update({
          where: { id: input.proposalId },
          data: { status: input.toStatus as PrismaProposalStatus },
        });

        if (input.note) {
          await tx.proposalNote.create({
            data: {
              proposalId: input.proposalId,
              authorId: input.actorUserId,
              team: input.actorTeam ?? null,
              body: input.note.body,
              kind: input.note.kind,
            },
          });
        }

        await tx.auditEvent.create({
          data: {
            entity: 'Proposal',
            entityId: input.proposalId,
            proposalId: input.proposalId,
            actorId: input.actorUserId,
            fromStatus: input.fromStatus,
            toStatus: input.toStatus,
          },
        });
      });
    },

    async addNote(input): Promise<ProposalNoteSummary> {
      const note = await db.proposalNote.create({
        data: {
          proposalId: input.proposalId,
          authorId: input.authorUserId,
          team: input.authorTeam ?? null,
          body: input.body,
          kind: input.kind,
        },
        include: { author: true },
      });
      return {
        id: note.id,
        authorName: note.author?.name ?? null,
        authorEmail: note.author?.email ?? '',
        team: (note.team ?? null) as StaffTeam | null,
        kind: note.kind as ProposalNoteKind,
        body: note.body,
        createdAt: note.createdAt,
      };
    },
  };
}
