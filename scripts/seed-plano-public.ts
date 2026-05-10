/**
 * Pré-cadastro de empresas públicas com sede em Plano, TX, materializando
 * o conceito de "Lastro indexa dados públicos antes da empresa reivindicar
 * seu perfil". Todas ficam com:
 *   - verificationStatus = 'UNVERIFIED'
 *   - sem CompanyMember (perfil "sem dono ainda")
 *   - dados básicos públicos: nome legal, endereço de sede, descrição genérica
 *
 * Quando uma empresa real reivindicar seu perfil via signup, esses
 * registros podem ser "claimed" (fora do escopo agora — manual via admin).
 *
 * Endereços e coordenadas são informação pública dos respectivos HQ.
 *
 * Run: pnpm tsx scripts/seed-plano-public.ts
 * Idempotente: upsert por slug.
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

type PreCadastro = {
  slug: string;
  taxId: string; // placeholder único enquanto não há claim
  legalName: string;
  tradeName: string;
  description: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number | null;
  offerings: Array<{ category: string; subcategory?: string; modality: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'; description?: string }>;
};

const COMPANIES: PreCadastro[] = [
  {
    slug: 'toyota-motor-north-america',
    taxId: 'US-PUB-TMNA-001',
    legalName: 'Toyota Motor North America, Inc.',
    tradeName: 'Toyota Motor North America',
    description:
      'Sede da Toyota Motor North America em Plano, TX. Operações continentais de manufatura, engenharia, vendas e finanças. Endereço: 6565 Headquarters Dr.',
    latitude: 33.0833,
    longitude: -96.8347,
    serviceRadiusKm: null,
    offerings: [
      {
        category: 'Manufatura automotiva',
        subcategory: 'Veículos leves',
        modality: 'PRODUCT_SUPPLY',
        description: 'Operações de manufatura e engenharia automotiva.',
      },
    ],
  },
  {
    slug: 'frito-lay',
    taxId: 'US-PUB-FRITO-002',
    legalName: 'Frito-Lay North America, Inc.',
    tradeName: 'Frito-Lay',
    description:
      'Sede da Frito-Lay (divisão da PepsiCo). 7701 Legacy Dr, Plano. Snacks e alimentos processados — pesquisa, manufatura e distribuição na América do Norte.',
    latitude: 33.0904,
    longitude: -96.8229,
    serviceRadiusKm: null,
    offerings: [
      {
        category: 'Alimentos e bebidas',
        subcategory: 'Snacks',
        modality: 'PRODUCT_SUPPLY',
        description: 'Manufatura de snacks. Programas internos de QA e microbiologia.',
      },
    ],
  },
  {
    slug: 'keurig-dr-pepper',
    taxId: 'US-PUB-KDP-003',
    legalName: 'Keurig Dr Pepper Inc.',
    tradeName: 'Keurig Dr Pepper',
    description:
      'Sede da Keurig Dr Pepper. 5301 Legacy Dr, Plano. Bebidas, cafés e refrigerantes — operações de manufatura, P&D e distribuição.',
    latitude: 33.0801,
    longitude: -96.8301,
    serviceRadiusKm: null,
    offerings: [
      {
        category: 'Alimentos e bebidas',
        subcategory: 'Bebidas',
        modality: 'PRODUCT_SUPPLY',
        description: 'Produção de bebidas. Controle de qualidade laboratorial.',
      },
    ],
  },
  {
    slug: 'fedex-office',
    taxId: 'US-PUB-FDXO-004',
    legalName: 'FedEx Office and Print Services, Inc.',
    tradeName: 'FedEx Office',
    description:
      'Sede da FedEx Office. 7900 Legacy Dr, Plano. Serviços de impressão, sinalização e logística corporativa.',
    latitude: 33.0914,
    longitude: -96.8243,
    serviceRadiusKm: 80,
    offerings: [
      {
        category: 'Serviços de impressão e sinalização',
        subcategory: 'Print e logística corporativa',
        modality: 'ONE_OFF',
        description: 'Impressão, plotagem, sinalização e remessas corporativas.',
      },
    ],
  },
  {
    slug: 'jpmorgan-chase-legacy-west',
    taxId: 'US-PUB-JPMC-005',
    legalName: 'JPMorgan Chase & Co. — Plano Campus',
    tradeName: 'JPMorgan Chase',
    description:
      'Campus do JPMorgan Chase em Legacy West, Plano. 6655 Communications Pkwy. Tecnologia, operações financeiras e back-office da rede norte-americana.',
    latitude: 33.0867,
    longitude: -96.8401,
    serviceRadiusKm: null,
    offerings: [
      {
        category: 'Serviços financeiros',
        subcategory: 'Banca corporativa',
        modality: 'RECURRING',
        description: 'Banca corporativa e serviços financeiros para empresas.',
      },
    ],
  },
  {
    slug: 'jcpenney',
    taxId: 'US-PUB-JCP-006',
    legalName: 'J. C. Penney Company, Inc.',
    tradeName: 'JCPenney',
    description:
      'Sede da JCPenney. 6501 Legacy Dr, Plano. Varejo de moda e bens de consumo — operações de compras, marketing e cadeia de suprimentos.',
    latitude: 33.0848,
    longitude: -96.8253,
    serviceRadiusKm: null,
    offerings: [
      {
        category: 'Varejo',
        subcategory: 'Moda e bens de consumo',
        modality: 'PRODUCT_SUPPLY',
        description: 'Compras corporativas e cadeia de suprimentos para varejo de moda.',
      },
    ],
  },
];

async function main() {
  console.log('🌱 Pré-cadastro Plano (dados públicos)…');

  for (const c of COMPANIES) {
    const existing = await db.company.findFirst({
      where: { OR: [{ slug: c.slug }, { taxId: c.taxId }] },
    });

    if (existing) {
      await db.company.update({
        where: { id: existing.id },
        data: {
          legalName: c.legalName,
          tradeName: c.tradeName,
          description: c.description,
          city: 'Plano',
          state: 'TX',
          latitude: c.latitude,
          longitude: c.longitude,
          serviceRadiusKm: c.serviceRadiusKm,
          verificationStatus: 'UNVERIFIED',
        },
      });
      console.log(`  · ${c.tradeName} já existia — atualizada.`);
    } else {
      const created = await db.company.create({
        data: {
          slug: c.slug,
          legalName: c.legalName,
          tradeName: c.tradeName,
          taxId: c.taxId,
          description: c.description,
          city: 'Plano',
          state: 'TX',
          latitude: c.latitude,
          longitude: c.longitude,
          serviceRadiusKm: c.serviceRadiusKm,
          verificationStatus: 'UNVERIFIED',
          offerings: { create: c.offerings },
        },
      });
      console.log(`  ✓ ${c.tradeName} criada (${created.id}).`);
    }
  }

  console.log('');
  console.log('✅ Pré-cadastro concluído.');
  console.log('');
  console.log(`${COMPANIES.length} empresas pré-cadastradas em Plano, TX.`);
  console.log('Status: UNVERIFIED — sem dono. Aparecem na TimeLine de ACERT no raio adequado.');
}

main()
  .catch((e) => {
    console.error('❌ Seed Plano falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
