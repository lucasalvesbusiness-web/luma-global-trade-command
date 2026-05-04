/**
 * Script de seed do Luma Global Trade Command.
 * Idempotente — upserts por chaves naturais (slug, iso2, code, email, reference).
 *
 * Executar:
 *   pnpm prisma:seed
 *
 * Pré-requisitos:
 *   - Docker Postgres em up (pnpm db:up)
 *   - Migrations aplicadas (pnpm prisma:migrate)
 */

import { PrismaClient } from '@prisma/client';

import { seedCountries, type SeedCountry } from './countries';
import { seedPorts } from './ports';
import { seedCities } from './cities';
import { seedOrigins } from './origins';
import { seedCategories, seedProducts } from './products';
import { seedContainerTypes } from './containers';
import {
  seedDocumentRequirements,
  seedPhytoRequirements,
  seedComplianceGates,
} from './document-requirements';
import {
  seedAvailabilities,
  seedHarvestWindows,
  seedFieldUpdates,
} from './availability';
import { seedStaffUsers, seedBuyers } from './users';
import { seedProposals } from './proposals';

const db = new PrismaClient();

const now = () => new Date();
const addDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// UN/LOCODE → ISO-3 mapping (apenas países seed; sufuciente para o MVP)
const iso3Map: Record<string, string> = {
  NL: 'NLD',
  AE: 'ARE',
  US: 'USA',
  PT: 'PRT',
  ES: 'ESP',
  BR: 'BRA',
};

async function seedGeo(): Promise<void> {
  console.log('→ Countries + Ports + Origin regions + Origins + Cities (seed)');

  // Countries (iso2 é PK natural)
  for (const c of seedCountries) {
    await db.country.upsert({
      where: { iso2: c.iso2 },
      create: {
        iso2: c.iso2,
        iso3: iso3Map[c.iso2] ?? c.iso2 + 'X',
        name: c.name,
        region: c.region,
      },
      update: {
        name: c.name,
        region: c.region,
      },
    });
  }

  // Ports — (countryIso2, code) é unique
  for (const p of seedPorts) {
    await db.port.upsert({
      where: { countryIso2_code: { countryIso2: p.countryIso2, code: p.code } },
      create: {
        countryIso2: p.countryIso2,
        name: p.name,
        code: p.code,
      },
      update: { name: p.name },
    });
  }

  // OriginRegion — uma única (Vale do São Francisco)
  const vale = await db.originRegion.upsert({
    where: { name: 'Vale do São Francisco' },
    create: {
      name: 'Vale do São Francisco',
      centroidLat: -9.3891,
      centroidLng: -40.5031,
    },
    update: {},
  });

  // Origins — slug é unique
  for (const o of seedOrigins) {
    await db.origin.upsert({
      where: { slug: o.slug },
      create: {
        name: o.name,
        slug: o.slug,
        kind: o.kind,
        regionId: vale.id,
        lat: o.location.lat,
        lng: o.location.lng,
        statusBlurb: o.statusBlurbPtBr,
        approvedCertifications: o.certifications,
      },
      update: {
        name: o.name,
        lat: o.location.lat,
        lng: o.location.lng,
        statusBlurb: o.statusBlurbPtBr,
        approvedCertifications: o.certifications,
      },
    });
  }

  // Cities — não temos tabela City no Prisma; cidades ficam no seed TS
  // e são usadas pelo canvas diretamente. (escopo MVP)
  console.log(`  · ${seedCities.length} cities no seed TS (não persistido)`);
}

async function seedCatalog(): Promise<void> {
  console.log('→ ProductCategory + Product + Variety');

  for (const c of seedCategories) {
    await db.productCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name },
      update: { name: c.name },
    });
  }

  for (const p of seedProducts) {
    const cat = await db.productCategory.findUnique({ where: { slug: p.categorySlug } });
    if (!cat) throw new Error(`Category not found: ${p.categorySlug}`);

    const product = await db.product.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        summary: p.summaryEn,
        heroImage: p.heroImage,
        tempRangeMinC: p.tempRangeMinC,
        tempRangeMaxC: p.tempRangeMaxC,
        shelfLifeDaysMin: p.shelfLifeDaysMin,
        shelfLifeDaysMax: p.shelfLifeDaysMax,
        recommendedContainerKind: p.recommendedContainerKind,
        categoryId: cat.id,
      },
      update: {
        name: p.name,
        summary: p.summaryEn,
        tempRangeMinC: p.tempRangeMinC,
        tempRangeMaxC: p.tempRangeMaxC,
        shelfLifeDaysMin: p.shelfLifeDaysMin,
        shelfLifeDaysMax: p.shelfLifeDaysMax,
        recommendedContainerKind: p.recommendedContainerKind,
        categoryId: cat.id,
      },
    });

    for (const v of p.varieties) {
      await db.variety.upsert({
        where: { productId_name: { productId: product.id, name: v.name } },
        create: {
          productId: product.id,
          name: v.name,
          boxWeightKg: v.boxWeightKg,
          boxDimensions: v.boxDimensions,
          palletConfig: v.palletConfig,
        },
        update: {
          boxWeightKg: v.boxWeightKg,
          boxDimensions: v.boxDimensions,
          palletConfig: v.palletConfig,
        },
      });
    }
  }
}

async function seedContainers(): Promise<void> {
  console.log('→ ContainerType');
  for (const c of seedContainerTypes) {
    await db.containerType.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        displayName: c.displayName,
        internalLengthM: c.internalLengthM,
        internalWidthM: c.internalWidthM,
        internalHeightM: c.internalHeightM,
        maxPayloadKg: c.maxPayloadKg,
        supportsReefer: c.supportsReefer,
        defaultTempC: c.defaultTempC,
      },
      update: {
        displayName: c.displayName,
        internalLengthM: c.internalLengthM,
        internalWidthM: c.internalWidthM,
        internalHeightM: c.internalHeightM,
        maxPayloadKg: c.maxPayloadKg,
        supportsReefer: c.supportsReefer,
        defaultTempC: c.defaultTempC,
      },
    });
  }
}

async function seedCompliance(): Promise<void> {
  console.log('→ DocumentRequirement + PhytosanitaryRequirement + ComplianceGate');

  // Document Requirements
  const docMap = new Map<string, string>(); // code → id
  for (const d of seedDocumentRequirements) {
    const doc = await db.documentRequirement.upsert({
      where: { code: d.code },
      create: { code: d.code, name: d.name, notes: d.notes ?? null },
      update: { name: d.name, notes: d.notes ?? null },
    });
    docMap.set(d.code, doc.id);
  }

  // Phyto Requirements (matriz produto × país)
  for (const r of seedPhytoRequirements) {
    const product = await db.product.findUnique({ where: { slug: r.productSlug } });
    if (!product) continue;

    const phyto = await db.phytosanitaryRequirement.upsert({
      where: {
        productId_countryIso2: {
          productId: product.id,
          countryIso2: r.countryIso2,
        },
      },
      create: {
        productId: product.id,
        countryIso2: r.countryIso2,
        notes: r.notesEn ?? null,
      },
      update: { notes: r.notesEn ?? null },
    });

    // Remove items antigos e re-cria (simples e idempotente)
    await db.phytosanitaryRequirementItem.deleteMany({
      where: { phytosanitaryRequirementId: phyto.id },
    });
    for (const code of r.documentCodes) {
      const docId = docMap.get(code);
      if (!docId) continue;
      await db.phytosanitaryRequirementItem.create({
        data: {
          phytosanitaryRequirementId: phyto.id,
          documentRequirementId: docId,
        },
      });
    }
  }

  // Compliance gates
  for (const g of seedComplianceGates) {
    const product = await db.product.findUnique({ where: { slug: g.productSlug } });
    if (!product) continue;
    await db.complianceGate.upsert({
      where: {
        productId_countryIso2: {
          productId: product.id,
          countryIso2: g.countryIso2,
        },
      },
      create: {
        productId: product.id,
        countryIso2: g.countryIso2,
        status: g.status,
        notes: g.notesEn ?? null,
      },
      update: { status: g.status, notes: g.notesEn ?? null },
    });
  }
}

async function seedAvailabilityData(): Promise<void> {
  console.log('→ Availability + HarvestWindow + FieldUpdate');

  // Limpa Availability/HarvestWindow para re-gerar (sem unique natural)
  await db.availability.deleteMany();
  await db.harvestWindow.deleteMany();

  for (const a of seedAvailabilities) {
    const product = await db.product.findUnique({ where: { slug: a.productSlug } });
    const origin = await db.origin.findUnique({ where: { slug: a.originSlug } });
    if (!product || !origin) continue;
    const variety = a.varietyName
      ? await db.variety.findUnique({
          where: { productId_name: { productId: product.id, name: a.varietyName } },
        })
      : null;

    await db.availability.create({
      data: {
        productId: product.id,
        varietyId: variety?.id ?? null,
        originId: origin.id,
        volumeTonsBand: a.volumeTonsBand,
        status: a.status,
        validFrom: addDays(a.validFromDaysOffset),
        validTo: addDays(a.validToDaysOffset),
        notes: a.notesEn ?? null,
      },
    });
  }

  for (const h of seedHarvestWindows) {
    const product = await db.product.findUnique({ where: { slug: h.productSlug } });
    const origin = await db.origin.findUnique({ where: { slug: h.originSlug } });
    if (!product || !origin) continue;
    const variety = h.varietyName
      ? await db.variety.findUnique({
          where: { productId_name: { productId: product.id, name: h.varietyName } },
        })
      : null;

    await db.harvestWindow.create({
      data: {
        productId: product.id,
        varietyId: variety?.id ?? null,
        originId: origin.id,
        startDate: addDays(h.startDaysOffset),
        endDate: addDays(h.endDaysOffset),
        confidence: h.confidence,
        notes: h.notesEn ?? null,
      },
    });
  }

  // Field updates: limpa e re-cria
  await db.fieldUpdate.deleteMany();
  for (const u of seedFieldUpdates) {
    const origin = await db.origin.findUnique({ where: { slug: u.originSlug } });
    if (!origin) continue;
    await db.fieldUpdate.create({
      data: {
        originId: origin.id,
        observedAt: addDays(u.observedDaysOffset),
        stage: u.stage,
        conditionNote: u.conditionNoteEn ?? null,
        riskSummary: u.riskSummaryEn ?? null,
        confidence: u.confidence,
      },
    });
  }
}

async function seedIdentity(): Promise<void> {
  console.log('→ Users (staff + buyers) + BuyerCompany');

  // Staff
  for (const s of seedStaffUsers) {
    const user = await db.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        name: s.name,
        role: s.role,
        locale: s.locale,
      },
      update: {
        name: s.name,
        role: s.role,
        locale: s.locale,
      },
    });
    await db.staffMember.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        team: s.team,
        title: s.title ?? null,
      },
      update: {
        team: s.team,
        title: s.title ?? null,
      },
    });
  }

  // Buyers + Companies
  for (const b of seedBuyers) {
    const user = await db.user.upsert({
      where: { email: b.user.email },
      create: {
        email: b.user.email,
        name: b.user.name,
        role: 'BUYER',
        locale: b.user.locale,
      },
      update: {
        name: b.user.name,
        role: 'BUYER',
        locale: b.user.locale,
      },
    });

    // Procura porto padrão (nullable)
    let defaultPortId: string | null = null;
    if (b.company.defaultPortId) {
      const [cIso, code] = inferPortIsoAndCode(b.company.defaultPortId);
      if (cIso && code) {
        const port = await db.port.findUnique({
          where: { countryIso2_code: { countryIso2: cIso, code } },
        });
        defaultPortId = port?.id ?? null;
      }
    }

    // Não temos unique em BuyerCompany.legalName — usamos busca + create/update manual
    const existingCompany = await db.buyerCompany.findFirst({
      where: { legalName: b.company.legalName },
    });
    const company = existingCompany
      ? await db.buyerCompany.update({
          where: { id: existingCompany.id },
          data: {
            displayName: b.company.displayName,
            type: b.company.type,
            countryIso2: b.company.countryIso2,
            city: b.company.city,
            address: b.company.address,
            defaultPortId,
            defaultIncoterm: b.company.defaultIncoterm,
            estimatedMonthlyVolume: b.company.estimatedMonthlyVolume,
          },
        })
      : await db.buyerCompany.create({
          data: {
            legalName: b.company.legalName,
            displayName: b.company.displayName,
            type: b.company.type,
            countryIso2: b.company.countryIso2,
            city: b.company.city,
            address: b.company.address,
            defaultPortId,
            defaultIncoterm: b.company.defaultIncoterm,
            estimatedMonthlyVolume: b.company.estimatedMonthlyVolume,
          },
        });

    await db.buyer.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyId: company.id,
      },
      update: {
        companyId: company.id,
      },
    });
  }
}

function inferPortIsoAndCode(seedPortId: string): [string | null, string | null] {
  // Nosso seedPort id é "port-<slug>". Precisamos reverter para achar iso2+code.
  // Solução simples: consultar pelo seed TS.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { seedPorts: allPorts } = require('./ports') as typeof import('./ports');
  const port = allPorts.find((p) => p.id === seedPortId);
  if (!port) return [null, null];
  return [port.countryIso2, port.code];
}

async function seedProposalData(): Promise<void> {
  console.log('→ Proposals (hero fixtures) + LoadPlan + AuditEvent');

  for (const p of seedProposals) {
    const buyerUser = await db.user.findUnique({ where: { email: p.buyerEmail } });
    if (!buyerUser) continue;
    const buyer = await db.buyer.findUnique({ where: { userId: buyerUser.id } });
    if (!buyer) continue;

    let portId: string | null = null;
    if (p.destinationPortId) {
      const [iso, code] = inferPortIsoAndCode(p.destinationPortId);
      if (iso && code) {
        const port = await db.port.findUnique({
          where: { countryIso2_code: { countryIso2: iso, code } },
        });
        portId = port?.id ?? null;
      }
    }

    const container = await db.containerType.findUnique({
      where: { code: p.loadPlan.containerCode },
    });
    if (!container) continue;

    // Upsert proposta por reference
    const proposal = await db.proposal.upsert({
      where: { reference: p.reference },
      create: {
        reference: p.reference,
        buyerCompanyId: buyer.companyId,
        destinationCountryIso: p.destinationCountryIso2,
        destinationPortId: portId,
        incoterm: p.incoterm,
        status: p.status,
        createdByUserId: buyerUser.id,
        submittedAt: addDays(p.submittedDaysOffset),
      },
      update: {
        status: p.status,
        destinationPortId: portId,
        incoterm: p.incoterm,
        submittedAt: addDays(p.submittedDaysOffset),
      },
    });

    // Load plan
    const loadPlan = await db.loadPlan.upsert({
      where: { proposalId: proposal.id },
      create: {
        proposalId: proposal.id,
        containerTypeId: container.id,
        configuredTempC: p.loadPlan.configuredTempC,
        notes: p.loadPlan.notes ?? null,
      },
      update: {
        containerTypeId: container.id,
        configuredTempC: p.loadPlan.configuredTempC,
        notes: p.loadPlan.notes ?? null,
      },
    });

    // Load items — limpa e re-cria
    await db.loadItem.deleteMany({ where: { loadPlanId: loadPlan.id } });
    for (const item of p.loadPlan.items) {
      const product = await db.product.findUnique({ where: { slug: item.productSlug } });
      if (!product) continue;
      const variety = item.varietyName
        ? await db.variety.findUnique({
            where: { productId_name: { productId: product.id, name: item.varietyName } },
          })
        : null;
      await db.loadItem.create({
        data: {
          loadPlanId: loadPlan.id,
          productId: product.id,
          varietyId: variety?.id ?? null,
          qtyBoxes: item.qtyBoxes,
          qtyPallets: item.qtyPallets,
          totalWeightKg: item.totalWeightKg,
        },
      });
    }

    // Notes — limpa e re-cria (fixtures narrativos)
    await db.proposalNote.deleteMany({ where: { proposalId: proposal.id } });
    for (const n of p.notes) {
      const author = await db.user.findUnique({ where: { email: n.authorEmail } });
      if (!author) continue;
      await db.proposalNote.create({
        data: {
          proposalId: proposal.id,
          authorId: author.id,
          team: n.team,
          body: n.body,
          kind: n.kind,
          createdAt: addDays(n.createdAtDaysOffset),
        },
      });
    }

    // Audit event (submissão)
    await db.auditEvent.create({
      data: {
        entity: 'Proposal',
        entityId: proposal.id,
        proposalId: proposal.id,
        actorId: buyerUser.id,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        occurredAt: addDays(p.submittedDaysOffset),
      },
    });
  }
}

// -------------------------------------------------------------
// Quieta o warning de country helper não usado
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused: SeedCountry | undefined = undefined;
// -------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`🌱  Luma seed — start at ${now().toISOString()}`);
  await seedGeo();
  await seedCatalog();
  await seedContainers();
  await seedCompliance();
  await seedAvailabilityData();
  await seedIdentity();
  await seedProposalData();
  console.log('✓  Luma seed — done.');
}

main()
  .catch((err) => {
    console.error('✗  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
