import type { LatLng } from '@/lib/canvas/types';

export type SeedOriginKind = 'OWN_FARM' | 'AUDITED_PARTNER' | 'AGROINDUSTRIAL_UNIT';

export type SeedOrigin = {
  id: string;
  slug: string;
  name: string;
  kind: SeedOriginKind;
  region: string;
  location: LatLng;
  statusBlurbPtBr: string;
  statusBlurbEn: string;
  certifications: string[];
};

/** Vale do São Francisco — centro aproximado (Petrolina–Juazeiro) */
export const valeDoSaoFranciscoCenter: LatLng = { lat: -9.3891, lng: -40.5031 };
export const valeDoSaoFranciscoBbox = {
  minLat: -10.2,
  maxLat: -8.4,
  minLng: -41.5,
  maxLng: -39.5,
};

export const seedOrigins: SeedOrigin[] = [
  {
    id: 'origin-fazenda-vale-norte',
    slug: 'fazenda-luma-vale-norte',
    name: 'Fazenda Luma Vale Norte',
    kind: 'OWN_FARM',
    region: 'Vale do São Francisco',
    location: { lat: -9.17, lng: -40.38 },
    statusBlurbPtBr: 'Produção ativa — manga e uva',
    statusBlurbEn: 'Active production — mango and grape',
    certifications: ['GlobalG.A.P.', 'GRASP'],
  },
  {
    id: 'origin-fazenda-rio-claro',
    slug: 'fazenda-luma-rio-claro',
    name: 'Fazenda Luma Rio Claro',
    kind: 'OWN_FARM',
    region: 'Vale do São Francisco',
    location: { lat: -9.52, lng: -40.71 },
    statusBlurbPtBr: 'Próxima colheita — manga e banana',
    statusBlurbEn: 'Next harvest — mango and banana',
    certifications: ['GlobalG.A.P.'],
  },
  {
    id: 'origin-parceiro-sertao-verde',
    slug: 'parceiro-sertao-verde',
    name: 'Parceiro Auditável Sertão Verde',
    kind: 'AUDITED_PARTNER',
    region: 'Vale do São Francisco',
    location: { lat: -9.08, lng: -40.88 },
    statusBlurbPtBr: 'Auditado — banana e mandioca',
    statusBlurbEn: 'Audited — banana and cassava',
    certifications: ['GlobalG.A.P.'],
  },
  {
    id: 'origin-agroindustrial-luma',
    slug: 'unidade-agroindustrial-luma',
    name: 'Unidade Agroindustrial Luma',
    kind: 'AGROINDUSTRIAL_UNIT',
    region: 'Vale do São Francisco',
    location: { lat: -9.39, lng: -40.5 },
    statusBlurbPtBr: 'Processamento disponível — polpas, açaí, farinha, amido',
    statusBlurbEn: 'Processing available — pulps, açaí, flour, starch',
    certifications: ['HACCP', 'FSSC 22000'],
  },
];

export function findOrigin(id: string): SeedOrigin | undefined {
  return seedOrigins.find((o) => o.id === id);
}
