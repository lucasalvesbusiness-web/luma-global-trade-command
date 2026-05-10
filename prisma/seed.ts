/**
 * Seed for the B2B Trust Network MVP.
 *
 * Creates:
 *  - 1 platform admin user
 *  - 5 companies (4 suppliers + 1 buyer) with varied verification states,
 *    locations across SP/RJ, descriptions, and category offerings
 *  - 4 historical deal rooms — 2 CONFIRMED (with submitted reviews),
 *    1 ACCEPTED in progress, 1 OPENED waiting for scope
 *
 * Run: pnpm prisma:seed
 *
 * Idempotent on a clean DB; not idempotent over re-runs (deletes nothing).
 * For a fresh seed: pnpm db:reset && pnpm prisma migrate dev && pnpm prisma:seed
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

import { ensureReviewsForConfirmedDeal } from '../server/services/reputation';

const db = new PrismaClient();

const SEED_PASSWORD = 'senha123';

async function main() {
  console.log('🌱 Seeding B2B Trust Network…');
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ─── Users ────────────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      email: 'admin@b2btrust.local',
      name: 'Admin Plataforma',
      role: 'ADMIN',
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const ownerRefrigera = await db.user.create({
    data: {
      email: 'dono@refrigerasul.com.br',
      name: 'Carla Mendes',
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const ownerEletro = await db.user.create({
    data: {
      email: 'dono@eletroforte.com.br',
      name: 'Rafael Souza',
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const ownerGuarda = await db.user.create({
    data: {
      email: 'dono@guardatech.com.br',
      name: 'Patrícia Lima',
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const ownerAvPro = await db.user.create({
    data: {
      email: 'dono@avpro.studio',
      name: 'Bruno Tavares',
      emailVerified: new Date(),
      passwordHash,
    },
  });

  const ownerMercado = await db.user.create({
    data: {
      email: 'compras@mercadocentral.com.br',
      name: 'Fernanda Alves',
      emailVerified: new Date(),
      passwordHash,
    },
  });

  // ─── Companies ────────────────────────────────────────────────────────

  // Supplier 1 — DOC_VERIFIED, refrigeração comercial em SP
  const refrigeraSul = await db.company.create({
    data: {
      slug: 'refrigera-sul',
      legalName: 'Refrigera Sul Climatização Ltda',
      tradeName: 'Refrigera Sul',
      taxId: '00000000000001',
      description:
        'Refrigeração comercial e climatização para mercados, restaurantes e clínicas. ' +
        '14 anos atendendo a Grande São Paulo. Equipe própria de 11 técnicos. ' +
        'Especialistas em câmaras frias e splits VRF.',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.5505,
      longitude: -46.6333,
      serviceRadiusKm: 80,
      verificationStatus: 'DOC_VERIFIED',
      members: { create: { userId: ownerRefrigera.id, role: 'OWNER' } },
      offerings: {
        create: [
          {
            category: 'Refrigeração',
            subcategory: 'Câmara fria comercial',
            modality: 'ONE_OFF',
            description: 'Instalação e manutenção corretiva de câmaras frias 5–80m³.',
          },
          {
            category: 'Refrigeração',
            subcategory: 'Manutenção preventiva',
            modality: 'RECURRING',
            description: 'Plano mensal com 2 visitas; relatórios fotográficos.',
          },
          {
            category: 'Climatização',
            modality: 'ONE_OFF',
            description: 'Splits 9k–60k BTUs; sistemas VRF para escritórios até 800m².',
          },
        ],
      },
    },
  });

  // Supplier 2 — DOC_VERIFIED, elétrica + manutenção em Campinas
  const eletroForte = await db.company.create({
    data: {
      slug: 'eletroforte',
      legalName: 'EletroForte Engenharia Ltda',
      tradeName: 'EletroForte',
      taxId: '00000000000002',
      description:
        'Engenharia elétrica e manutenção predial para indústrias e galpões. ' +
        'Engenheiro responsável CREA-SP, equipe NR-10. Atende Campinas, Jundiaí e ABC.',
      city: 'Campinas',
      state: 'SP',
      latitude: -22.9099,
      longitude: -47.0626,
      serviceRadiusKm: 120,
      verificationStatus: 'DOC_VERIFIED',
      members: { create: { userId: ownerEletro.id, role: 'OWNER' } },
      offerings: {
        create: [
          {
            category: 'Elétrica',
            subcategory: 'Quadros e cabines primárias',
            modality: 'ONE_OFF',
            description: 'Projeto + execução de cabines até 1500 kVA.',
          },
          {
            category: 'Manutenção predial',
            modality: 'RECURRING',
            description: 'Contrato mensal com SLA de 4h para emergências.',
          },
        ],
      },
    },
  });

  // Supplier 3 — EMAIL_VERIFIED, segurança eletrônica + TI em SP
  const guardaTech = await db.company.create({
    data: {
      slug: 'guardatech',
      legalName: 'GuardaTech Soluções em Segurança Eletrônica Ltda',
      tradeName: 'GuardaTech',
      taxId: '00000000000003',
      description:
        'CFTV IP, controle de acesso biométrico e infraestrutura de rede para PMEs. ' +
        'Parceiros Hikvision e Ubiquiti. Sem operação noturna; resposta em 24h úteis.',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.5839,
      longitude: -46.6394,
      serviceRadiusKm: 60,
      verificationStatus: 'EMAIL_VERIFIED',
      members: { create: { userId: ownerGuarda.id, role: 'OWNER' } },
      offerings: {
        create: [
          {
            category: 'Segurança eletrônica',
            subcategory: 'CFTV IP',
            modality: 'ONE_OFF',
            description: 'Projeto até 64 câmeras; storage redundante.',
          },
          {
            category: 'Segurança eletrônica',
            subcategory: 'Controle de acesso',
            modality: 'PRODUCT_SUPPLY',
            description: 'Catracas, leitores biométricos e fechaduras eletrônicas.',
          },
          {
            category: 'TI para PMEs',
            modality: 'RECURRING',
            description: 'Sustentação mensal: rede, firewall, backups.',
          },
        ],
      },
    },
  });

  // Supplier 4 — UNVERIFIED, audiovisual no Rio
  const avPro = await db.company.create({
    data: {
      slug: 'avpro-studio',
      legalName: 'AVPro Studio Produções Audiovisuais Ltda',
      tradeName: 'AVPro Studio',
      taxId: '00000000000004',
      description:
        'Conteúdo audiovisual corporativo e comunicação visual de loja. ' +
        'Equipe pequena, foco em vídeos institucionais e signage. Recém-cadastrada na plataforma.',
      city: 'Rio de Janeiro',
      state: 'RJ',
      latitude: -22.9068,
      longitude: -43.1729,
      serviceRadiusKm: 50,
      verificationStatus: 'UNVERIFIED',
      members: { create: { userId: ownerAvPro.id, role: 'OWNER' } },
      offerings: {
        create: [
          {
            category: 'Audiovisual corporativo',
            modality: 'ONE_OFF',
            description: 'Vídeos institucionais 60–180s; roteiro + captação + edição.',
          },
          {
            category: 'Comunicação visual',
            modality: 'PRODUCT_SUPPLY',
            description: 'Plotagem de fachada, signage interno, banners.',
          },
        ],
      },
    },
  });

  // Buyer — Mercado Central, comprador recorrente
  const mercadoCentral = await db.company.create({
    data: {
      slug: 'mercado-central',
      legalName: 'Mercado Central de Alimentos S.A.',
      tradeName: 'Mercado Central',
      taxId: '00000000000005',
      description:
        'Rede de mercados de bairro com 6 unidades na Grande São Paulo. ' +
        'Comprador frequente de serviços técnicos prediais.',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.5613,
      longitude: -46.6565,
      serviceRadiusKm: null,
      verificationStatus: 'DOC_VERIFIED',
      members: { create: { userId: ownerMercado.id, role: 'OWNER' } },
      offerings: { create: [] },
    },
  });

  // ─── Deal rooms ───────────────────────────────────────────────────────

  // Deal 1 — CONFIRMED: Mercado Central comprou refrigeração da Refrigera Sul
  const deal1 = await db.dealRoom.create({
    data: {
      buyerCompanyId: mercadoCentral.id,
      supplierCompanyId: refrigeraSul.id,
      template: 'ONE_OFF',
      status: 'CONFIRMED',
      title: 'Instalação câmara fria 12m³ — Loja Vila Mariana',
      scopePayload: {
        summary:
          'Câmara fria 12m³ para açougue + setor de hortifruti. Inclui projeto, instalação ' +
          'da unidade condensadora, evaporador, painéis isotérmicos, porta com cortina de ar.',
        expectedDurationDays: 21,
      } as never,
      quoteCents: 4200000, // R$ 42.000
      quoteCurrency: 'BRL',
      acceptedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      evidences: {
        create: [
          {
            kind: 'PHOTO',
            url: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200',
            caption: 'Câmara fria pronta — vista interna',
            uploadedById: ownerRefrigera.id,
            acceptedById: ownerMercado.id,
            acceptedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          },
          {
            kind: 'DOC',
            url: 'https://example.com/nf-42000.pdf',
            caption: 'NF-e 8721',
            uploadedById: ownerRefrigera.id,
          },
        ],
      },
    },
  });

  // Deal 2 — CONFIRMED: outra compra do Mercado Central (gera recorrência)
  const deal2 = await db.dealRoom.create({
    data: {
      buyerCompanyId: mercadoCentral.id,
      supplierCompanyId: refrigeraSul.id,
      template: 'RECURRING',
      status: 'CONFIRMED',
      title: 'Manutenção preventiva mensal — 6 unidades',
      scopePayload: {
        summary:
          'Plano mensal de manutenção preventiva em todos os equipamentos de refrigeração ' +
          'e climatização das 6 lojas. Relatório fotográfico por visita.',
        cadence: 'MONTHLY',
        cyclesCount: 12,
      } as never,
      quoteCents: 850000, // R$ 8.500/mês
      quoteCurrency: 'BRL',
      acceptedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    },
  });

  // Deal 3 — CONFIRMED: EletroForte fez quadro elétrico para Mercado Central
  const deal3 = await db.dealRoom.create({
    data: {
      buyerCompanyId: mercadoCentral.id,
      supplierCompanyId: eletroForte.id,
      template: 'ONE_OFF',
      status: 'CONFIRMED',
      title: 'Cabine primária 500 kVA — Loja Tatuapé',
      scopePayload: {
        summary:
          'Projeto e execução de cabine primária 500 kVA, conforme NBR 14039. Inclui ' +
          'aprovação na concessionária e ART.',
        expectedDurationDays: 45,
      } as never,
      quoteCents: 18500000, // R$ 185.000
      quoteCurrency: 'BRL',
      acceptedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
    },
  });

  // Deal 4 — IN_PROGRESS: GuardaTech instalando CFTV
  await db.dealRoom.create({
    data: {
      buyerCompanyId: mercadoCentral.id,
      supplierCompanyId: guardaTech.id,
      template: 'ONE_OFF',
      status: 'IN_PROGRESS',
      title: 'CFTV IP 24 câmeras — Loja Pinheiros',
      scopePayload: {
        summary: 'CFTV IP com 24 câmeras dome 4MP + storage NVR 16 canais com 30 dias de retenção.',
        expectedDurationDays: 14,
      } as never,
      quoteCents: 3800000, // R$ 38.000
      quoteCurrency: 'BRL',
      acceptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // ─── Reviews (auto-create then submit for confirmed deals) ────────────
  for (const dealId of [deal1.id, deal2.id, deal3.id]) {
    await ensureReviewsForConfirmedDeal(dealId, db);
  }

  // Buyer rates suppliers (positive)
  await db.review.updateMany({
    where: {
      dealRoomId: { in: [deal1.id, deal2.id] },
      raterCompanyId: mercadoCentral.id,
      ratedCompanyId: refrigeraSul.id,
    },
    data: {
      rating: 5,
      comment: 'Equipe pontual, entrega impecável. Já vamos contratar de novo.',
      category: 'Refrigeração',
      submittedAt: new Date(),
    },
  });

  await db.review.updateMany({
    where: {
      dealRoomId: deal3.id,
      raterCompanyId: mercadoCentral.id,
      ratedCompanyId: eletroForte.id,
    },
    data: {
      rating: 4,
      comment: 'Atrasou 1 semana mas entregou com qualidade técnica acima da concorrência.',
      category: 'Elétrica',
      submittedAt: new Date(),
    },
  });

  // Suppliers rate buyer (also positive)
  await db.review.updateMany({
    where: {
      dealRoomId: { in: [deal1.id, deal2.id] },
      raterCompanyId: refrigeraSul.id,
      ratedCompanyId: mercadoCentral.id,
    },
    data: {
      rating: 5,
      comment: 'Cliente decisivo, paga em dia.',
      submittedAt: new Date(),
    },
  });

  await db.review.updateMany({
    where: {
      dealRoomId: deal3.id,
      raterCompanyId: eletroForte.id,
      ratedCompanyId: mercadoCentral.id,
    },
    data: {
      rating: 5,
      submittedAt: new Date(),
    },
  });

  console.log('✅ Seed completo.');
  console.log('');
  console.log(`Logins (senha padrão: ${SEED_PASSWORD}):`);
  console.log(`  ADMIN    → ${admin.email}`);
  console.log(`  Compr.   → ${ownerMercado.email}     (Mercado Central — DOC_VERIFIED)`);
  console.log(`  Forn. 1  → ${ownerRefrigera.email}    (Refrigera Sul — 2 deals confirmados)`);
  console.log(`  Forn. 2  → ${ownerEletro.email}      (EletroForte — 1 deal confirmado)`);
  console.log(`  Forn. 3  → ${ownerGuarda.email}      (GuardaTech — 1 deal em execução)`);
  console.log(`  Forn. 4  → ${ownerAvPro.email}            (AVPro Studio — não verificada)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
