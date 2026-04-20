/**
 * Produtos seed — narrativa completa para MVP.
 * Referência: briefing §8 e docs/06 (ontologia).
 *
 * Convenções:
 * - slug é o identificador estável usado por repositórios e rotas
 * - temperaturas em °C; shelfLife em dias (intervalo mín/máx)
 * - recommendedContainerKind casa com o enum Prisma RecommendedContainerKind
 */

export type RecommendedContainerKind =
  | 'REEFER_20'
  | 'REEFER_40'
  | 'REEFER_40_HC'
  | 'DRY_20'
  | 'DRY_40';

export type SeedVariety = {
  name: string;
  boxWeightKg: number;
  boxDimensions: string;
  palletConfig: string;
};

export type SeedProduct = {
  slug: string;
  categorySlug: string;
  name: string;
  namePtBr: string;
  summaryPtBr: string;
  summaryEn: string;
  heroImage: string | null;
  tempRangeMinC: number | null;
  tempRangeMaxC: number | null;
  shelfLifeDaysMin: number | null;
  shelfLifeDaysMax: number | null;
  recommendedContainerKind: RecommendedContainerKind;
  varieties: SeedVariety[];
};

export type SeedCategory = {
  slug: string;
  name: string;
  namePtBr: string;
};

export const seedCategories: SeedCategory[] = [
  { slug: 'fresh-fruits', name: 'Fresh fruits', namePtBr: 'Frutas frescas' },
  { slug: 'frozen-pulps', name: 'Frozen pulps', namePtBr: 'Polpas congeladas' },
  { slug: 'cassava-dry', name: 'Cassava dry goods', namePtBr: 'Mandioca industrializada' },
];

export const seedProducts: SeedProduct[] = [
  {
    slug: 'mango',
    categorySlug: 'fresh-fruits',
    name: 'Mango',
    namePtBr: 'Manga',
    summaryPtBr:
      'Manga do Vale do São Francisco, irrigada e classificada em packing próprio. Disponível em variedades comerciais para mercado internacional.',
    summaryEn:
      'Mango from the São Francisco Valley, irrigated and graded at own packing. Available in commercial varieties for international markets.',
    heroImage: null,
    tempRangeMinC: 10,
    tempRangeMaxC: 12,
    shelfLifeDaysMin: 21,
    shelfLifeDaysMax: 28,
    recommendedContainerKind: 'REEFER_40_HC',
    varieties: [
      { name: 'Palmer', boxWeightKg: 4, boxDimensions: '40×30×11 cm', palletConfig: '200 cx / pallet' },
      { name: 'Tommy Atkins', boxWeightKg: 4, boxDimensions: '40×30×11 cm', palletConfig: '200 cx / pallet' },
      { name: 'Kent', boxWeightKg: 6, boxDimensions: '40×30×15 cm', palletConfig: '150 cx / pallet' },
    ],
  },
  {
    slug: 'grape',
    categorySlug: 'fresh-fruits',
    name: 'Grape',
    namePtBr: 'Uva',
    summaryPtBr:
      'Uva de mesa sem sementes do polo do Vale, com calibre e coloração selecionados para exportação. Colheita rastreada talhão a talhão.',
    summaryEn:
      'Seedless table grape from the Vale belt, with caliber and color selected for export. Traceable by plot.',
    heroImage: null,
    tempRangeMinC: 0,
    tempRangeMaxC: 2,
    shelfLifeDaysMin: 30,
    shelfLifeDaysMax: 45,
    recommendedContainerKind: 'REEFER_40_HC',
    varieties: [
      { name: 'Crimson', boxWeightKg: 4.5, boxDimensions: '50×30×9 cm', palletConfig: '216 cx / pallet' },
      { name: 'Thompson', boxWeightKg: 4.5, boxDimensions: '50×30×9 cm', palletConfig: '216 cx / pallet' },
      { name: 'Sweet Globe', boxWeightKg: 4.5, boxDimensions: '50×30×9 cm', palletConfig: '216 cx / pallet' },
    ],
  },
  {
    slug: 'banana',
    categorySlug: 'fresh-fruits',
    name: 'Banana',
    namePtBr: 'Banana',
    summaryPtBr:
      'Banana do Vale em variedades Prata e Cavendish. Rastreabilidade de packing até pallet; apta a mercados nacional e internacional.',
    summaryEn:
      'Vale banana in Prata and Cavendish varieties. Traceability from packing to pallet; suitable for domestic and international markets.',
    heroImage: null,
    tempRangeMinC: 13,
    tempRangeMaxC: 14,
    shelfLifeDaysMin: 21,
    shelfLifeDaysMax: 30,
    recommendedContainerKind: 'REEFER_40_HC',
    varieties: [
      { name: 'Prata', boxWeightKg: 18, boxDimensions: '50×40×25 cm', palletConfig: '48 cx / pallet' },
      { name: 'Cavendish', boxWeightKg: 18, boxDimensions: '50×40×25 cm', palletConfig: '48 cx / pallet' },
    ],
  },
  {
    slug: 'fruit-pulp',
    categorySlug: 'frozen-pulps',
    name: 'Fruit pulp',
    namePtBr: 'Polpa de fruta',
    summaryPtBr:
      'Polpas congeladas em embalagem industrial. Sabores: manga, acerola, goiaba e maracujá. Processadas na unidade agroindustrial Luma.',
    summaryEn:
      'Industrial frozen pulps. Flavors: mango, acerola, guava and passion fruit. Processed at Luma agroindustrial unit.',
    heroImage: null,
    tempRangeMinC: -18,
    tempRangeMaxC: -18,
    shelfLifeDaysMin: 365,
    shelfLifeDaysMax: 540,
    recommendedContainerKind: 'REEFER_40',
    varieties: [
      { name: 'Mango pulp', boxWeightKg: 10, boxDimensions: '40×30×15 cm', palletConfig: '90 cx / pallet' },
      { name: 'Acerola pulp', boxWeightKg: 10, boxDimensions: '40×30×15 cm', palletConfig: '90 cx / pallet' },
      { name: 'Guava pulp', boxWeightKg: 10, boxDimensions: '40×30×15 cm', palletConfig: '90 cx / pallet' },
      { name: 'Passion fruit pulp', boxWeightKg: 10, boxDimensions: '40×30×15 cm', palletConfig: '90 cx / pallet' },
    ],
  },
  {
    slug: 'acai',
    categorySlug: 'frozen-pulps',
    name: 'Açaí',
    namePtBr: 'Açaí',
    summaryPtBr:
      'Polpa de açaí congelada em balde ou saco-caixa. Produto agroindustrial — sujeito a consulta de disponibilidade por janela sazonal.',
    summaryEn:
      'Frozen açaí pulp in pail or bag-in-box. Agroindustrial product — availability subject to seasonal consultation.',
    heroImage: null,
    tempRangeMinC: -18,
    tempRangeMaxC: -18,
    shelfLifeDaysMin: 365,
    shelfLifeDaysMax: 540,
    recommendedContainerKind: 'REEFER_40',
    varieties: [
      { name: 'Pail 10 kg', boxWeightKg: 10, boxDimensions: 'D 28×H 25 cm', palletConfig: '90 und / pallet' },
      { name: 'Bag-in-box 10 kg', boxWeightKg: 10, boxDimensions: '40×30×15 cm', palletConfig: '90 cx / pallet' },
    ],
  },
  {
    slug: 'cassava-flour',
    categorySlug: 'cassava-dry',
    name: 'Cassava flour',
    namePtBr: 'Farinha de mandioca',
    summaryPtBr:
      'Farinha de mandioca em saco 25 kg, processada na unidade agroindustrial. Produto estável — container seco padrão.',
    summaryEn:
      'Cassava flour in 25 kg bags, processed at the agroindustrial unit. Shelf-stable — standard dry container.',
    heroImage: null,
    tempRangeMinC: null,
    tempRangeMaxC: null,
    shelfLifeDaysMin: 180,
    shelfLifeDaysMax: 365,
    recommendedContainerKind: 'DRY_40',
    varieties: [
      { name: 'Fine', boxWeightKg: 25, boxDimensions: 'Bag 60×40×12 cm', palletConfig: '40 sc / pallet' },
      { name: 'Coarse', boxWeightKg: 25, boxDimensions: 'Bag 60×40×12 cm', palletConfig: '40 sc / pallet' },
    ],
  },
  {
    slug: 'cassava-starch',
    categorySlug: 'cassava-dry',
    name: 'Cassava starch',
    namePtBr: 'Amido de mandioca',
    summaryPtBr:
      'Amido de mandioca (polvilho doce) em saco 25 kg. Ingrediente industrial estável — container seco padrão.',
    summaryEn:
      'Cassava starch (sweet polvilho) in 25 kg bags. Shelf-stable industrial ingredient — standard dry container.',
    heroImage: null,
    tempRangeMinC: null,
    tempRangeMaxC: null,
    shelfLifeDaysMin: 365,
    shelfLifeDaysMax: 540,
    recommendedContainerKind: 'DRY_40',
    varieties: [
      { name: 'Sweet (polvilho doce)', boxWeightKg: 25, boxDimensions: 'Bag 60×40×12 cm', palletConfig: '40 sc / pallet' },
      { name: 'Sour (polvilho azedo)', boxWeightKg: 25, boxDimensions: 'Bag 60×40×12 cm', palletConfig: '40 sc / pallet' },
    ],
  },
];

export function findProduct(slug: string): SeedProduct | undefined {
  return seedProducts.find((p) => p.slug === slug);
}
