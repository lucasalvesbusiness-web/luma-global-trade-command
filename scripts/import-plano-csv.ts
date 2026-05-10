/**
 * Importa empresas pré-cadastradas a partir de scraping do Google Maps.
 *
 * Arquivo: BaseEmpresasTexas - Página1.csv (raiz do projeto)
 * Origem: scraping de Google Maps Plano TX (farmacêuticas, farmácias,
 * laboratórios, escritórios, consultorias).
 *
 * Cada empresa entra como verificationStatus='UNVERIFIED' (sem dono).
 * lat/lng extraídos da URL do Maps via regex.
 *
 * Run: pnpm tsx scripts/import-plano-csv.ts
 * Idempotente: upsert por slug; pula duplicatas (mesmo nome + mesma URL).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const CSV_PATH = path.resolve(
  process.cwd(),
  'BaseEmpresasTexas - Página1.csv',
);

type Row = {
  url: string;
  name: string;
  category: string;
  fields: string[];
  website: string;
};

const CATEGORY_TO_OFFERING: Record<
  string,
  { category: string; subcategory?: string; modality: 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY'; description: string }
> = {
  'Empresa farmacêutica': {
    category: 'Farmacêutica',
    subcategory: 'Indústria farmacêutica',
    modality: 'PRODUCT_SUPPLY',
    description: 'Pesquisa, produção e distribuição de medicamentos.',
  },
  'Farmácia': {
    category: 'Farmácia varejo',
    modality: 'PRODUCT_SUPPLY',
    description: 'Dispensação de medicamentos e produtos farmacêuticos.',
  },
  'Laboratório': {
    category: 'Análises laboratoriais',
    modality: 'ONE_OFF',
    description: 'Análises clínicas, microbiológicas e/ou físico-químicas.',
  },
  'Empresa biotecnológica': {
    category: 'Biotecnologia',
    modality: 'PRODUCT_SUPPLY',
    description: 'Desenvolvimento e produção de soluções biotecnológicas.',
  },
  'Empresa de medicamentos': {
    category: 'Farmacêutica',
    modality: 'PRODUCT_SUPPLY',
    description: 'Produção de medicamentos.',
  },
  'Pesquisa médica': {
    category: 'Pesquisa e desenvolvimento',
    modality: 'ONE_OFF',
    description: 'Pesquisa clínica e desenvolvimento de terapias.',
  },
  'Empresa de equipamento médico': {
    category: 'Equipamentos médicos',
    modality: 'PRODUCT_SUPPLY',
    description: 'Fabricação e comercialização de equipamentos médicos.',
  },
  'Consultoria empresarial': {
    category: 'Consultoria',
    modality: 'ONE_OFF',
    description: 'Consultoria empresarial.',
  },
  'Escritório da empresa': {
    category: 'Escritório corporativo',
    modality: 'RECURRING',
    description: 'Sede ou escritório regional de operações corporativas.',
  },
  'Distribuidora de Produtos Farmacêuticos': {
    category: 'Distribuição farmacêutica',
    modality: 'PRODUCT_SUPPLY',
    description: 'Distribuição atacadista de produtos farmacêuticos.',
  },
  'Agência de empregos': {
    category: 'RH e recrutamento',
    modality: 'ONE_OFF',
    description: 'Recrutamento e colocação profissional.',
  },
};

const DEFAULT_OFFERING = {
  category: 'Outros serviços B2B',
  modality: 'ONE_OFF' as const,
  description: 'Serviços empresariais.',
};

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractLatLng(url: string): { lat: number; lng: number } | null {
  // Format: !8m2!3d{LAT}!4d{LNG}
  const m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function looksLikeAddress(s: string): boolean {
  if (!s) return false;
  // Starts with digit + space then text (typical US street address)
  return /^\d+\s+\S+/.test(s.trim());
}

function findAddress(fields: string[]): string | null {
  for (const f of fields) {
    if (looksLikeAddress(f)) return f.trim();
  }
  return null;
}

async function main() {
  console.log(`🌱 Importando empresas de ${path.basename(CSV_PATH)}…`);

  const raw = readFileSync(CSV_PATH, 'utf8');
  const records: string[][] = parse(raw, {
    relax_column_count: true,
    relax_quotes: true,
    skip_empty_lines: true,
    trim: true,
  });

  // First row is header
  const header = records[0];
  if (!header) {
    throw new Error('CSV vazio.');
  }
  console.log(`  CSV tem ${records.length - 1} linhas de dados.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const seenSlugs = new Set<string>();
  const seenUrls = new Set<string>();

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (!row) continue;
    const url = (row[0] ?? '').trim();
    const name = (row[1] ?? '').trim();
    const category = (row[3] ?? '').trim();

    if (!url || !name) {
      skipped++;
      continue;
    }
    if (seenUrls.has(url)) {
      skipped++;
      continue;
    }
    seenUrls.add(url);

    const coords = extractLatLng(url);
    if (!coords) {
      console.warn(`  ⚠ sem coords: ${name}`);
      failed++;
      continue;
    }

    const allFields = row.slice(4).map((s) => (s ?? '').trim());
    const address = findAddress(allFields);

    // Build description
    let description = '';
    if (category) description += `Categoria: ${category}.`;
    if (address) description += `\nEndereço: ${address}, Plano TX (aprox.).`;
    description += '\n\nEmpresa pré-cadastrada via dados públicos. Aguardando reivindicação do perfil.';

    // Dedup slug
    let slug = slugify(name);
    if (!slug) {
      slug = `empresa-${i}`;
    }
    let candidate = slug;
    let counter = 2;
    while (seenSlugs.has(candidate)) {
      candidate = `${slug}-${counter++}`;
    }
    slug = candidate;
    seenSlugs.add(slug);

    const taxId = `US-IMPORT-${slug}`;

    const offering =
      CATEGORY_TO_OFFERING[category] ??
      (category ? { ...DEFAULT_OFFERING, description: `Serviços de ${category.toLowerCase()}.` } : DEFAULT_OFFERING);

    try {
      const existing = await db.company.findFirst({
        where: { OR: [{ slug }, { taxId }] },
      });

      if (existing) {
        await db.company.update({
          where: { id: existing.id },
          data: {
            legalName: name,
            tradeName: name,
            description,
            city: 'Plano',
            state: 'TX',
            latitude: coords.lat,
            longitude: coords.lng,
            verificationStatus: 'UNVERIFIED',
          },
        });
        updated++;
      } else {
        await db.company.create({
          data: {
            slug,
            legalName: name,
            tradeName: name,
            taxId,
            description,
            city: 'Plano',
            state: 'TX',
            latitude: coords.lat,
            longitude: coords.lng,
            verificationStatus: 'UNVERIFIED',
            offerings: { create: offering },
          },
        });
        created++;
      }
    } catch (e) {
      failed++;
      console.warn(`  ⚠ falha ${name}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log('');
  console.log('✅ Import concluído.');
  console.log(`   Criadas:    ${created}`);
  console.log(`   Atualizadas: ${updated}`);
  console.log(`   Puladas:    ${skipped} (sem URL, duplicatas, ou vazias)`);
  console.log(`   Falharam:   ${failed}`);
}

main()
  .catch((e) => {
    console.error('❌ Import falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
