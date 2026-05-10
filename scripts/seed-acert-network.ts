/**
 * Conecta 25% das empresas pré-cadastradas em Plano com a ACERT.
 *
 * Distribuição:
 *  - 25% das importadas (≈56) → conectadas com ACERT
 *  - Dessas, 50% (≈28) com DealRoom em diferentes estados FSM
 *  - As outras (≈28) só com CompanyWatch (ACERT acompanha)
 *
 * Distribuição de status nos 28 deals:
 *   CONFIRMED (8) · CLOSED (2) · IN_PROGRESS (6) · ACCEPTED (4)
 *   DELIVERED (2) · QUOTED (4) · SCOPED (2)
 *
 * - CONFIRMED/CLOSED disparam reviews bilaterais auto-submetidas
 *   (rating 4-5) e emitem ActivityEvent DEAL_CONFIRMED.
 * - Cada deal tem AuditEvent OPENED + transitions registradas.
 * - ACERT é sempre SUPPLIER; a contraparte é BUYER.
 *
 * Idempotente: skipa se já existir DealRoom ou Watch ACERT↔target.
 *
 * Run: pnpm tsx scripts/seed-acert-network.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Deterministic pseudo-random (mulberry32) — mesma seed = mesmo subset
let SEED = 0x4c41535452; // "LASTR" em hex
function rand(): number {
  let t = (SEED += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
function randomInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

const TWENTY_FIVE_PCT = 0.25;
const FIFTY_PCT_OF_CONNECTED = 0.5;

// Distribuição de status (soma = 28)
const STATUS_DISTRIBUTION: Array<{ status: string; count: number }> = [
  { status: 'CONFIRMED', count: 8 },
  { status: 'CLOSED', count: 2 },
  { status: 'IN_PROGRESS', count: 6 },
  { status: 'ACCEPTED', count: 4 },
  { status: 'DELIVERED', count: 2 },
  { status: 'QUOTED', count: 4 },
  { status: 'SCOPED', count: 2 },
];

function titleFor(category: string, template: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'): string {
  const year = 2026;
  const lot = `L${randomInt(20000, 99999)}`;
  if (template === 'RECURRING') {
    const cad = pick(['mensal', 'trimestral']);
    if (category.includes('farmacêutica') || category.includes('Farmácia')) {
      return `Análise microbiológica ${cad} — ${year}`;
    }
    return `QA ${cad} — ${year}`;
  }
  if (template === 'PRODUCT_SUPPLY') {
    if (category.includes('Laboratório')) {
      return `Cross-validation ISO 17025 — ${year}`;
    }
    return `Validação técnica — ${year}`;
  }
  // ONE_OFF
  if (category.includes('Farmácia') || category.includes('farmacêutica')) {
    return pick([
      `Análise de pureza — Lote ${lot}`,
      `Estabilidade acelerada — Lote ${lot}`,
      `Validação de método analítico — ${year}`,
      `Microbiologia ${pick(['água', 'matéria-prima', 'produto acabado'])} — Lote ${lot}`,
    ]);
  }
  if (category.includes('Laboratório')) {
    return pick([
      `Auditoria de competência analítica — ${year}`,
      `Calibração instrumental — ${year}`,
    ]);
  }
  if (category.includes('Consultoria')) {
    return `Auditoria QA — Q${randomInt(1, 4)} ${year}`;
  }
  if (category.includes('Distribuidora')) {
    return `Inspeção de armazenagem — ${year}`;
  }
  return pick([
    `Avaliação técnica — ${year}`,
    `Análise química — Lote ${lot}`,
    `Validação de processo — ${year}`,
  ]);
}

function templateFor(category: string): 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY' {
  if (category.includes('Farmácia') && !category.includes('farmacêutica')) {
    // farmácias de bairro → análises pontuais
    return pick(['ONE_OFF', 'ONE_OFF', 'RECURRING']);
  }
  if (category.includes('farmacêutica')) {
    return pick(['ONE_OFF', 'RECURRING', 'RECURRING', 'PRODUCT_SUPPLY']);
  }
  if (category.includes('Laboratório')) {
    return pick(['PRODUCT_SUPPLY', 'ONE_OFF']);
  }
  if (category.includes('Distribuidora')) {
    return 'RECURRING';
  }
  return pick(['ONE_OFF', 'ONE_OFF', 'RECURRING']);
}

function scopeFor(
  template: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY',
  category: string,
): Record<string, unknown> {
  if (template === 'ONE_OFF') {
    return {
      summary: `Serviço analítico pontual para ${category || 'cliente'} em Plano TX. Inclui amostragem, ensaio, laudo emitido pela ACERT.`,
      expectedDurationDays: randomInt(7, 30),
    };
  }
  if (template === 'RECURRING') {
    return {
      summary: `Programa de QA recorrente com a ACERT — análises mensais/trimestrais conforme protocolo.`,
      cadence: pick(['MONTHLY', 'QUARTERLY']),
      cyclesCount: randomInt(6, 12),
    };
  }
  return {
    summary: `Fornecimento técnico-laboratorial em pacote definido — ACERT como provedor acreditado.`,
    itemDescription: `Serviços de ${category || 'análise técnica'}`,
    quantity: randomInt(1, 12),
    unit: 'lote',
    expectedDeliveryDays: randomInt(14, 60),
  };
}

function quoteCentsFor(template: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'): number {
  // USD em centavos
  if (template === 'ONE_OFF') return randomInt(1500, 12000) * 100;
  if (template === 'RECURRING') return randomInt(2000, 9000) * 100; // mensal
  return randomInt(8000, 60000) * 100;
}

function reviewCommentFor(category: string): string {
  return pick([
    'Entrega no prazo combinado. Laudo claro e auditável.',
    'Comunicação direta, sem ruído. Resultado dentro do escopo.',
    'ACERT entendeu o desafio técnico rápido. Recomendo.',
    `Boa cobertura para ${category || 'a categoria'}. Continuaremos a contratar.`,
    'Acreditação ISO bem documentada. Atendimento técnico forte.',
  ]);
}

function reviewCommentForBuyer(): string {
  return pick([
    'Cliente decisivo, escopo bem definido.',
    'Pagamento em dia, comunicação objetiva.',
    'Boa parceria. Aceitam o protocolo técnico sem fricção.',
  ]);
}

type FSMStatus =
  | 'OPENED'
  | 'SCOPED'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CONFIRMED'
  | 'CLOSED';

const FSM_ORDER: FSMStatus[] = [
  'OPENED',
  'SCOPED',
  'QUOTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'DELIVERED',
  'CONFIRMED',
  'CLOSED',
];

function timestampsForStatus(target: FSMStatus): Record<string, Date | null> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  // Cada estado posterior puxa a data mais atrás (mais antigo).
  // Distância entre estados ≈ 7-15 dias.
  const offsets: Record<FSMStatus, number> = {
    OPENED: 0,
    SCOPED: 5,
    QUOTED: 10,
    ACCEPTED: 18,
    IN_PROGRESS: 28,
    DELIVERED: 45,
    CONFIRMED: 50,
    CLOSED: 60,
  };
  const totalOffset = offsets[target] * day;
  const openedAt = new Date(now - totalOffset);

  const result: Record<string, Date | null> = {
    openedAt,
    acceptedAt: null,
    deliveredAt: null,
    confirmedAt: null,
    closedAt: null,
  };

  const idx = FSM_ORDER.indexOf(target);
  if (idx >= FSM_ORDER.indexOf('ACCEPTED')) {
    result.acceptedAt = new Date(now - (offsets[target] - offsets.ACCEPTED) * day);
  }
  if (idx >= FSM_ORDER.indexOf('DELIVERED')) {
    result.deliveredAt = new Date(now - (offsets[target] - offsets.DELIVERED) * day);
  }
  if (idx >= FSM_ORDER.indexOf('CONFIRMED')) {
    result.confirmedAt = new Date(now - (offsets[target] - offsets.CONFIRMED) * day);
  }
  if (idx >= FSM_ORDER.indexOf('CLOSED')) {
    result.closedAt = new Date(now - (offsets[target] - offsets.CLOSED) * day);
  }
  return result;
}

async function ensureReviewsBilateral(dealRoomId: string, acertId: string, buyerId: string) {
  // ACERT (rated supplier) avalia BUYER
  await db.review.upsert({
    where: { dealRoomId_raterCompanyId: { dealRoomId, raterCompanyId: acertId } },
    create: {
      dealRoomId,
      raterCompanyId: acertId,
      ratedCompanyId: buyerId,
      rating: randomInt(4, 5),
      comment: reviewCommentForBuyer(),
      submittedAt: new Date(),
    },
    update: {
      rating: randomInt(4, 5),
      submittedAt: new Date(),
    },
  });
  await db.review.upsert({
    where: { dealRoomId_raterCompanyId: { dealRoomId, raterCompanyId: buyerId } },
    create: {
      dealRoomId,
      raterCompanyId: buyerId,
      ratedCompanyId: acertId,
      rating: randomInt(4, 5),
      comment: reviewCommentFor(''),
      submittedAt: new Date(),
    },
    update: {
      rating: randomInt(4, 5),
      submittedAt: new Date(),
    },
  });
}

async function emitActivityForConfirmed(
  dealRoomId: string,
  acertId: string,
  buyerId: string,
  title: string,
  template: string,
) {
  await db.activityEvent.create({
    data: {
      type: 'DEAL_CONFIRMED',
      actorCompanyId: acertId,
      subjectCompanyId: buyerId,
      dealRoomId,
      visibility: 'PUBLIC',
      metadata: { title, template, role: 'SUPPLIER' } as never,
    },
  });
  await db.activityEvent.create({
    data: {
      type: 'DEAL_CONFIRMED',
      actorCompanyId: buyerId,
      subjectCompanyId: acertId,
      dealRoomId,
      visibility: 'PUBLIC',
      metadata: { title, template, role: 'BUYER' } as never,
    },
  });
}

async function main() {
  console.log('🌱 Conectando 25% das empresas importadas com ACERT…');

  // ACERT
  const acert = await db.company.findUnique({ where: { slug: 'acert' } });
  if (!acert) throw new Error('ACERT não encontrada. Rode scripts/seed-acert.ts primeiro.');

  // Pega owner (precisa para AuditEvent actor)
  const acertOwner = await db.companyMember.findFirst({
    where: { companyId: acert.id, role: 'OWNER' },
    select: { userId: true },
  });
  const acertActorId = acertOwner?.userId ?? null;

  // Empresas importadas via CSV
  const imported = await db.company.findMany({
    where: { taxId: { startsWith: 'US-IMPORT-' } },
    include: { offerings: { take: 1, select: { category: true } } },
  });

  console.log(`  Encontradas ${imported.length} empresas importadas.`);

  // Shuffle deterministico + slice 25%
  const shuffled = shuffle(imported);
  const connectedCount = Math.floor(shuffled.length * TWENTY_FIVE_PCT);
  const dealCount = Math.floor(connectedCount * FIFTY_PCT_OF_CONNECTED);
  const watchCount = connectedCount - dealCount;
  const totalPlanned =
    STATUS_DISTRIBUTION.reduce((a, b) => a + b.count, 0);

  // Ajusta dealCount se a distribuição prevê outro número (28)
  const finalDealCount = Math.min(dealCount, totalPlanned);
  console.log(
    `  Vão receber deal: ${finalDealCount} · Só watch: ${watchCount} · Restantes (sem conexão): ${shuffled.length - connectedCount}`,
  );

  const dealCompanies = shuffled.slice(0, finalDealCount);
  const watchCompanies = shuffled.slice(finalDealCount, finalDealCount + watchCount);

  // Expanda distribuição em array de status (28 items)
  const statusQueue: FSMStatus[] = [];
  for (const { status, count } of STATUS_DISTRIBUTION) {
    for (let i = 0; i < count; i++) statusQueue.push(status as FSMStatus);
  }
  // Shuffle a fila pra distribuir aleatoriamente entre dealCompanies
  const shuffledStatuses = shuffle(statusQueue).slice(0, finalDealCount);

  let dealsCreated = 0;
  let dealsSkipped = 0;
  let watchesCreated = 0;
  let watchesSkipped = 0;

  // ───── DEALS ─────
  for (let i = 0; i < dealCompanies.length; i++) {
    const buyer = dealCompanies[i]!;
    const status = shuffledStatuses[i]!;

    // Skip se já existe deal entre ACERT e essa buyer
    const existing = await db.dealRoom.findFirst({
      where: {
        OR: [
          { buyerCompanyId: buyer.id, supplierCompanyId: acert.id },
          { buyerCompanyId: acert.id, supplierCompanyId: buyer.id },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      dealsSkipped++;
      continue;
    }

    const cat = buyer.offerings[0]?.category ?? '';
    const template = templateFor(cat);
    const title = titleFor(cat, template);
    const scope = scopeFor(template, cat);
    const quoteCents =
      status === 'OPENED' || status === 'SCOPED' ? null : quoteCentsFor(template);
    const timestamps = timestampsForStatus(status);

    const deal = await db.dealRoom.create({
      data: {
        buyerCompanyId: buyer.id,
        supplierCompanyId: acert.id,
        template,
        status,
        title,
        scopePayload: scope as never,
        quoteCents,
        quoteCurrency: 'USD',
        openedAt: timestamps.openedAt as Date,
        acceptedAt: timestamps.acceptedAt,
        deliveredAt: timestamps.deliveredAt,
        confirmedAt: timestamps.confirmedAt,
        closedAt: timestamps.closedAt,
      },
    });

    // AuditEvent OPENED + transição final
    if (acertActorId) {
      await db.auditEvent.create({
        data: {
          entityType: 'DealRoom',
          entityId: deal.id,
          action: 'OPENED',
          actorId: acertActorId,
          toStatus: 'OPENED',
        },
      });
      if (status !== 'OPENED') {
        await db.auditEvent.create({
          data: {
            entityType: 'DealRoom',
            entityId: deal.id,
            action: 'TRANSITION_TO_' + status,
            actorId: acertActorId,
            fromStatus: 'OPENED',
            toStatus: status,
          },
        });
      }
    }

    // CONFIRMED/CLOSED → reviews bilaterais + activity events
    if (status === 'CONFIRMED' || status === 'CLOSED') {
      await ensureReviewsBilateral(deal.id, acert.id, buyer.id);
      await emitActivityForConfirmed(deal.id, acert.id, buyer.id, title, template);
    }

    dealsCreated++;
  }

  // ───── WATCHES ─────
  for (const target of watchCompanies) {
    const existing = await db.companyWatch.findUnique({
      where: {
        watcherCompanyId_watchedCompanyId: {
          watcherCompanyId: acert.id,
          watchedCompanyId: target.id,
        },
      },
    });
    if (existing) {
      watchesSkipped++;
      continue;
    }
    await db.companyWatch.create({
      data: {
        watcherCompanyId: acert.id,
        watchedCompanyId: target.id,
      },
    });
    watchesCreated++;
  }

  console.log('');
  console.log('✅ Rede ACERT populada.');
  console.log(`   Deals criados:    ${dealsCreated}  (pulados: ${dealsSkipped})`);
  console.log(`   Watches criados:  ${watchesCreated} (pulados: ${watchesSkipped})`);
  console.log('');

  // Resumo por status
  const byStatus = await db.dealRoom.groupBy({
    by: ['status'],
    where: { supplierCompanyId: acert.id },
    _count: { _all: true },
  });
  console.log('   Distribuição final de deals (supplier=ACERT):');
  for (const s of byStatus.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`     ${s.status.padEnd(12)} ${s._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed ACERT network falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
