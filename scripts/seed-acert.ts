/**
 * Seed da ACERT — primeira empresa real do produto.
 *
 * Endereço: 101 E Park Blvd, Plano, TX 75074, EUA
 * Coordenadas: 33.0188, -96.6989 (aproximadas via OpenStreetMap)
 *
 * Run: pnpm tsx scripts/seed-acert.ts
 *
 * Idempotente: se já existir, atualiza os campos básicos.
 */

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const ACERT_DATA = {
  email: 'admin@acert.com',
  ownerName: 'ACERT Admin',
  password: 'senha123',
  slug: 'acert',
  taxId: 'US-LAB-ACERT-001', // placeholder enquanto não tem CNPJ (US)
  legalName: 'American National Laboratory Accreditation Corp.',
  tradeName: 'ACERT',
  description: `American National Laboratory Accreditation — ACERT.

Precision, reliability, and innovation in every analysis. Our laboratory delivers accurate results you can trust for your critical testing needs.

We accredit laboratories across analytical, environmental, materials and calibration disciplines, ensuring that every certified result meets the highest standard of traceability and reproducibility.`,
  city: 'Plano',
  state: 'TX',
  latitude: 33.0188,
  longitude: -96.6989,
  serviceRadiusKm: 50,
  verificationStatus: 'DOC_VERIFIED',
  heroImageUrl: null as string | null,
};

const OFFERINGS = [
  {
    category: 'Análises laboratoriais',
    subcategory: 'Química analítica',
    modality: 'ONE_OFF' as const,
    description:
      'Análises físico-químicas, espectroscopia (FTIR/UV-Vis), cromatografia (HPLC/GC), análise elementar.',
  },
  {
    category: 'Análises laboratoriais',
    subcategory: 'Microbiologia',
    modality: 'ONE_OFF' as const,
    description: 'Contagem microbiana, identificação de patógenos, ensaios de esterilidade.',
  },
  {
    category: 'Certificação e acreditação',
    subcategory: 'Acreditação laboratorial',
    modality: 'PRODUCT_SUPPLY' as const,
    description:
      'Avaliação e acreditação de laboratórios analíticos, ambientais, de materiais e calibração conforme ISO/IEC 17025.',
  },
  {
    category: 'Controle de qualidade',
    subcategory: 'QA recorrente',
    modality: 'RECURRING' as const,
    description: 'Programas mensais de controle de qualidade e auditoria de processos analíticos.',
  },
];

async function main() {
  console.log('🌱 Seeding ACERT…');

  const passwordHash = await bcrypt.hash(ACERT_DATA.password, 10);

  // User
  const user = await db.user.upsert({
    where: { email: ACERT_DATA.email },
    create: {
      email: ACERT_DATA.email,
      name: ACERT_DATA.ownerName,
      passwordHash,
      emailVerified: new Date(),
    },
    update: { passwordHash, name: ACERT_DATA.ownerName },
  });

  // Company
  const existing = await db.company.findFirst({
    where: { OR: [{ slug: ACERT_DATA.slug }, { taxId: ACERT_DATA.taxId }] },
  });

  let company;
  if (existing) {
    company = await db.company.update({
      where: { id: existing.id },
      data: {
        legalName: ACERT_DATA.legalName,
        tradeName: ACERT_DATA.tradeName,
        description: ACERT_DATA.description,
        city: ACERT_DATA.city,
        state: ACERT_DATA.state,
        latitude: ACERT_DATA.latitude,
        longitude: ACERT_DATA.longitude,
        serviceRadiusKm: ACERT_DATA.serviceRadiusKm,
        verificationStatus: ACERT_DATA.verificationStatus,
        heroImageUrl: ACERT_DATA.heroImageUrl,
      },
    });
    console.log(`✓ ACERT já existia — atualizada (${company.id}).`);

    // Ensure owner membership
    await db.companyMember.upsert({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
      create: { userId: user.id, companyId: company.id, role: 'OWNER' },
      update: {},
    });
  } else {
    company = await db.company.create({
      data: {
        slug: ACERT_DATA.slug,
        legalName: ACERT_DATA.legalName,
        tradeName: ACERT_DATA.tradeName,
        taxId: ACERT_DATA.taxId,
        description: ACERT_DATA.description,
        city: ACERT_DATA.city,
        state: ACERT_DATA.state,
        latitude: ACERT_DATA.latitude,
        longitude: ACERT_DATA.longitude,
        serviceRadiusKm: ACERT_DATA.serviceRadiusKm,
        verificationStatus: ACERT_DATA.verificationStatus,
        heroImageUrl: ACERT_DATA.heroImageUrl,
        members: { create: { userId: user.id, role: 'OWNER' } },
        offerings: { create: OFFERINGS },
      },
    });
    console.log(`✓ ACERT criada (${company.id}).`);

    // AuditEvent for company creation
    await db.auditEvent.create({
      data: {
        entityType: 'Company',
        entityId: company.id,
        action: 'CREATED',
        actorId: user.id,
        toStatus: company.verificationStatus,
      },
    });
  }

  // Re-sync offerings (delete extras + add missing)
  const currentOfferings = await db.serviceOffering.findMany({
    where: { companyId: company.id },
  });
  const wantedKeys = new Set(OFFERINGS.map((o) => `${o.category}::${o.subcategory ?? ''}`));
  for (const o of currentOfferings) {
    const k = `${o.category}::${o.subcategory ?? ''}`;
    if (!wantedKeys.has(k)) {
      await db.serviceOffering.delete({ where: { id: o.id } });
    }
  }
  const currentKeys = new Set(
    currentOfferings.map((o) => `${o.category}::${o.subcategory ?? ''}`),
  );
  for (const o of OFFERINGS) {
    const k = `${o.category}::${o.subcategory ?? ''}`;
    if (!currentKeys.has(k)) {
      await db.serviceOffering.create({ data: { ...o, companyId: company.id } });
    }
  }

  console.log('');
  console.log('✅ ACERT pronta.');
  console.log('');
  console.log('Login:');
  console.log(`  Email: ${ACERT_DATA.email}`);
  console.log(`  Senha: ${ACERT_DATA.password}`);
  console.log('');
  console.log('URLs:');
  console.log(`  /c/${ACERT_DATA.slug}  ← perfil público`);
  console.log(`  /home                 ← TimeLine centrada em Plano, TX (33.0188, -96.6989)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed ACERT falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
