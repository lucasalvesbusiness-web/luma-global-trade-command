/**
 * Proposal service — converte um draft client-side em Proposal persistida.
 * Toda transição gera AuditEvent (R16 do briefing).
 */

import { db } from '@/lib/db';
import { sendProposalNotification } from '@/server/mail/proposal-notification';
import { sendProposalReceivedBuyer } from '@/server/mail/proposal-received-buyer';
import { findPort as findSeedPort } from '@/data/seed/ports';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve o portId vindo do cliente em um registro real de Port.
 * Aceita UUID (id direto do DB) ou seed id ("port-rotterdam"), este último
 * sendo mapeado via UN/LOCODE + país para o Port persistido.
 */
async function resolvePortId(
  rawId: string | null | undefined,
): Promise<{ id: string } | null> {
  if (!rawId) return null;
  if (UUID_RE.test(rawId)) {
    const found = await db.port.findUnique({ where: { id: rawId } });
    return found ? { id: found.id } : null;
  }
  const seedPort = findSeedPort(rawId);
  if (!seedPort) return null;
  const found = await db.port.findUnique({
    where: {
      countryIso2_code: {
        countryIso2: seedPort.countryIso2,
        code: seedPort.code,
      },
    },
  });
  return found ? { id: found.id } : null;
}

type BuyerInput = {
  legalName: string;
  displayName?: string | null;
  type:
    | 'IMPORTER'
    | 'DISTRIBUTOR'
    | 'WHOLESALER'
    | 'RETAIL'
    | 'INDUSTRY'
    | 'TRADER';
  countryIso2: string;
  city?: string | null;
  address?: string | null;
  contactName: string;
  contactEmail: string;
  contactLocale?: 'pt-br' | 'en';
};

type LoadItemInput = {
  productSlug: string;
  varietyId: string;
  qtyBoxes: number;
  qtyPallets: number;
  totalWeightKg: number;
};

export type SubmitProposalInput = {
  destinationCountryIso2: string;
  destinationPortId?: string | null;
  incoterm?: string | null;
  buyer: BuyerInput;
  container: {
    code: 'C_20_RF' | 'C_40_RF' | 'C_40_HC_RF' | 'C_20_DR' | 'C_40_DR';
    configuredTempC?: number | null;
  };
  items: LoadItemInput[];
  buyerNote?: string | null;
};

export type SubmitProposalResult = {
  proposalId: string;
  reference: string;
  status: 'SUBMITTED';
};

/**
 * Gera uma reference legível tipo LUMA-YYYY-NNNNN.
 * Idempotente sob retry: se falhar antes do insert, o número vira seq naturalmente.
 */
async function nextReference(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const countThisYear = await db.proposal.count({
    where: { reference: { startsWith: `LUMA-${year}-` } },
  });
  const seq = (countThisYear + 1).toString().padStart(5, '0');
  return `LUMA-${year}-${seq}`;
}

export async function submitProposalFromDraft(
  input: SubmitProposalInput,
): Promise<SubmitProposalResult> {
  if (input.items.length === 0) {
    throw new Error('Cannot submit proposal without load items.');
  }

  // 1) Upsert User + BuyerCompany + Buyer (cria na hora se não existir)
  const user = await db.user.upsert({
    where: { email: input.buyer.contactEmail },
    create: {
      email: input.buyer.contactEmail,
      name: input.buyer.contactName,
      role: 'BUYER',
      locale: input.buyer.contactLocale ?? 'en',
    },
    update: {
      name: input.buyer.contactName,
    },
  });

  const port = await resolvePortId(input.destinationPortId);

  let company = await db.buyerCompany.findFirst({
    where: { legalName: input.buyer.legalName },
  });
  if (!company) {
    company = await db.buyerCompany.create({
      data: {
        legalName: input.buyer.legalName,
        displayName: input.buyer.displayName ?? null,
        type: input.buyer.type,
        countryIso2: input.buyer.countryIso2,
        city: input.buyer.city ?? null,
        address: input.buyer.address ?? null,
        defaultPortId: port?.id ?? null,
        defaultIncoterm: input.incoterm ?? null,
      },
    });
  }

  await db.buyer.upsert({
    where: { userId: user.id },
    create: { userId: user.id, companyId: company.id },
    update: { companyId: company.id },
  });

  // 2) Encontra ContainerType pelo código
  const containerType = await db.containerType.findUnique({
    where: { code: input.container.code },
  });
  if (!containerType) {
    throw new Error(`Container type not found: ${input.container.code}`);
  }

  // 3) Cria Proposal + LoadPlan + LoadItems em uma transação
  const reference = await nextReference();

  const proposal = await db.$transaction(async (tx) => {
    const p = await tx.proposal.create({
      data: {
        reference,
        buyerCompanyId: company!.id,
        destinationCountryIso: input.destinationCountryIso2,
        destinationPortId: port?.id ?? null,
        incoterm: input.incoterm ?? null,
        status: 'SUBMITTED',
        createdByUserId: user.id,
        submittedAt: new Date(),
      },
    });

    const loadPlan = await tx.loadPlan.create({
      data: {
        proposalId: p.id,
        containerTypeId: containerType.id,
        configuredTempC: input.container.configuredTempC ?? null,
      },
    });

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { slug: item.productSlug } });
      if (!product) continue;
      await tx.loadItem.create({
        data: {
          loadPlanId: loadPlan.id,
          productId: product.id,
          varietyId: item.varietyId,
          qtyBoxes: item.qtyBoxes,
          qtyPallets: item.qtyPallets,
          totalWeightKg: item.totalWeightKg,
        },
      });
    }

    if (input.buyerNote) {
      await tx.proposalNote.create({
        data: {
          proposalId: p.id,
          authorId: user.id,
          team: null,
          body: input.buyerNote,
          kind: 'TO_BUYER',
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        entity: 'Proposal',
        entityId: p.id,
        proposalId: p.id,
        actorId: user.id,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
      },
    });

    return p;
  });

  // 4) Notificações best-effort — falhas nunca derrubam a submissão.
  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  try {
    await sendProposalNotification({
      reference,
      buyerLegalName: company.legalName,
      buyerContactName: input.buyer.contactName,
      destinationCountryIso2: input.destinationCountryIso2,
      itemsCount: input.items.length,
      containerCode: input.container.code,
    });
  } catch (err) {
    console.warn('[proposal] failed to send internal notification', err);
  }
  try {
    await sendProposalReceivedBuyer({
      to: input.buyer.contactEmail,
      buyerContactName: input.buyer.contactName,
      reference,
      itemsCount: input.items.length,
      destinationCountryIso2: input.destinationCountryIso2,
      containerCode: input.container.code,
      baseUrl,
    });
  } catch (err) {
    console.warn('[proposal] failed to send buyer receipt', err);
  }

  return {
    proposalId: proposal.id,
    reference,
    status: 'SUBMITTED',
  };
}
