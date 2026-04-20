/**
 * Lotes (FieldPlot) fictícios nas origens Luma do Vale do São Francisco.
 *
 * Escala realista: ~1.1 × 1.1 km por lote (~120 ha), comum para fazendas
 * de exportação do Vale. Densidade alta para o mapa ficar vivo quando o
 * comprador destaca um produto.
 */

export type PlotStatus = 'PRODUCING' | 'NEXT_HARVEST' | 'RESTING' | 'AUDIT';

export type FieldPlot = {
  id: string;
  originSlug: string;
  productSlug: string;
  label: string;
  areaHa: number;
  status: PlotStatus;
  polygon: [number, number][]; // GeoJSON [lng, lat]
  centroid: [number, number];
};

function box(
  centerLng: number,
  centerLat: number,
  dLng: number,
  dLat: number,
): [number, number][] {
  return [
    [centerLng - dLng, centerLat - dLat],
    [centerLng + dLng, centerLat - dLat],
    [centerLng + dLng, centerLat + dLat],
    [centerLng - dLng, centerLat + dLat],
    [centerLng - dLng, centerLat - dLat],
  ];
}

// Tamanho padrão de lote: ~2.5 km × 2.5 km (~600 ha) — área 5× maior que a
// versão anterior (lado × sqrt(5) para chegar a 5× na superfície).
const DLNG = 0.0213;
const DLAT = 0.0213;

// Bases das origens
const VN = { lat: -9.17, lng: -40.38 }; // Vale Norte — manga + uva
const RC = { lat: -9.52, lng: -40.71 }; // Rio Claro — manga + banana
const SV = { lat: -9.08, lng: -40.88 }; // Sertão Verde — banana + mandioca
const AI = { lat: -9.39, lng: -40.5 }; // Agroindustrial — polpas + açaí

// STEP = 2.5 × DLNG garante espaço entre lotes mesmo com a área 5× maior.
const STEP = 0.058;

export const fieldPlots: FieldPlot[] = [
  // ==================== VALE NORTE ====================
  // Manga — 5 lotes
  {
    id: 'plot-vn-mango-palmer-1',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'mango',
    label: 'Lote A1 — Manga Palmer',
    areaHa: 128,
    status: 'PRODUCING',
    polygon: box(VN.lng - STEP * 1.5, VN.lat - STEP * 0.5, DLNG, DLAT),
    centroid: [VN.lng - STEP * 1.5, VN.lat - STEP * 0.5],
  },
  {
    id: 'plot-vn-mango-palmer-2',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'mango',
    label: 'Lote A2 — Manga Palmer',
    areaHa: 115,
    status: 'PRODUCING',
    polygon: box(VN.lng - STEP * 1.5, VN.lat + STEP * 0.5, DLNG, DLAT),
    centroid: [VN.lng - STEP * 1.5, VN.lat + STEP * 0.5],
  },
  {
    id: 'plot-vn-mango-tommy-1',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'mango',
    label: 'Lote A3 — Manga Tommy Atkins',
    areaHa: 110,
    status: 'PRODUCING',
    polygon: box(VN.lng - STEP * 0.5, VN.lat + STEP * 1.0, DLNG, DLAT),
    centroid: [VN.lng - STEP * 0.5, VN.lat + STEP * 1.0],
  },
  {
    id: 'plot-vn-mango-tommy-2',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'mango',
    label: 'Lote A4 — Manga Tommy Atkins',
    areaHa: 90,
    status: 'NEXT_HARVEST',
    polygon: box(VN.lng - STEP * 0.5, VN.lat - STEP * 1.0, DLNG, DLAT),
    centroid: [VN.lng - STEP * 0.5, VN.lat - STEP * 1.0],
  },
  {
    id: 'plot-vn-mango-kent-1',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'mango',
    label: 'Lote A5 — Manga Kent (experimental)',
    areaHa: 60,
    status: 'AUDIT',
    polygon: box(VN.lng - STEP * 0.5, VN.lat, DLNG * 0.75, DLAT * 0.75),
    centroid: [VN.lng - STEP * 0.5, VN.lat],
  },
  // Uva — 4 lotes
  {
    id: 'plot-vn-grape-sweet-1',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'grape',
    label: 'Lote B1 — Uva Sweet Globe',
    areaHa: 85,
    status: 'NEXT_HARVEST',
    polygon: box(VN.lng + STEP * 0.8, VN.lat - STEP * 0.5, DLNG, DLAT),
    centroid: [VN.lng + STEP * 0.8, VN.lat - STEP * 0.5],
  },
  {
    id: 'plot-vn-grape-sweet-2',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'grape',
    label: 'Lote B2 — Uva Sweet Globe',
    areaHa: 78,
    status: 'NEXT_HARVEST',
    polygon: box(VN.lng + STEP * 0.8, VN.lat + STEP * 0.5, DLNG, DLAT),
    centroid: [VN.lng + STEP * 0.8, VN.lat + STEP * 0.5],
  },
  {
    id: 'plot-vn-grape-thompson-1',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'grape',
    label: 'Lote B3 — Uva Thompson',
    areaHa: 70,
    status: 'AUDIT',
    polygon: box(VN.lng + STEP * 1.7, VN.lat + STEP * 0.2, DLNG, DLAT),
    centroid: [VN.lng + STEP * 1.7, VN.lat + STEP * 0.2],
  },
  {
    id: 'plot-vn-grape-crimson-1',
    originSlug: 'fazenda-luma-vale-norte',
    productSlug: 'grape',
    label: 'Lote B4 — Uva Crimson',
    areaHa: 92,
    status: 'NEXT_HARVEST',
    polygon: box(VN.lng + STEP * 1.7, VN.lat - STEP * 0.8, DLNG, DLAT),
    centroid: [VN.lng + STEP * 1.7, VN.lat - STEP * 0.8],
  },

  // ==================== RIO CLARO ====================
  // Manga — 3 lotes
  {
    id: 'plot-rc-mango-kent-1',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'mango',
    label: 'Lote C1 — Manga Kent',
    areaHa: 100,
    status: 'NEXT_HARVEST',
    polygon: box(RC.lng - STEP, RC.lat - STEP * 0.5, DLNG, DLAT),
    centroid: [RC.lng - STEP, RC.lat - STEP * 0.5],
  },
  {
    id: 'plot-rc-mango-kent-2',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'mango',
    label: 'Lote C2 — Manga Kent',
    areaHa: 95,
    status: 'NEXT_HARVEST',
    polygon: box(RC.lng - STEP, RC.lat + STEP * 0.5, DLNG, DLAT),
    centroid: [RC.lng - STEP, RC.lat + STEP * 0.5],
  },
  {
    id: 'plot-rc-mango-palmer-1',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'mango',
    label: 'Lote C3 — Manga Palmer (reserva)',
    areaHa: 80,
    status: 'RESTING',
    polygon: box(RC.lng - STEP * 2, RC.lat, DLNG, DLAT),
    centroid: [RC.lng - STEP * 2, RC.lat],
  },
  // Banana — 4 lotes
  {
    id: 'plot-rc-banana-prata-1',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'banana',
    label: 'Lote D1 — Banana Prata',
    areaHa: 140,
    status: 'PRODUCING',
    polygon: box(RC.lng + STEP * 0.8, RC.lat + STEP * 0.5, DLNG, DLAT),
    centroid: [RC.lng + STEP * 0.8, RC.lat + STEP * 0.5],
  },
  {
    id: 'plot-rc-banana-prata-2',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'banana',
    label: 'Lote D2 — Banana Prata',
    areaHa: 130,
    status: 'PRODUCING',
    polygon: box(RC.lng + STEP * 0.8, RC.lat - STEP * 0.6, DLNG, DLAT),
    centroid: [RC.lng + STEP * 0.8, RC.lat - STEP * 0.6],
  },
  {
    id: 'plot-rc-banana-cavendish-1',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'banana',
    label: 'Lote D3 — Banana Cavendish',
    areaHa: 120,
    status: 'PRODUCING',
    polygon: box(RC.lng + STEP * 1.7, RC.lat + STEP * 0.2, DLNG, DLAT),
    centroid: [RC.lng + STEP * 1.7, RC.lat + STEP * 0.2],
  },
  {
    id: 'plot-rc-banana-cavendish-2',
    originSlug: 'fazenda-luma-rio-claro',
    productSlug: 'banana',
    label: 'Lote D4 — Banana Cavendish',
    areaHa: 105,
    status: 'NEXT_HARVEST',
    polygon: box(RC.lng + STEP * 1.7, RC.lat - STEP, DLNG, DLAT),
    centroid: [RC.lng + STEP * 1.7, RC.lat - STEP],
  },

  // ==================== SERTÃO VERDE ====================
  // Banana — 2 lotes parceiro
  {
    id: 'plot-sv-banana-1',
    originSlug: 'parceiro-sertao-verde',
    productSlug: 'banana',
    label: 'Lote E1 — Banana Cavendish (parceiro)',
    areaHa: 160,
    status: 'AUDIT',
    polygon: box(SV.lng - STEP, SV.lat + STEP * 0.5, DLNG, DLAT),
    centroid: [SV.lng - STEP, SV.lat + STEP * 0.5],
  },
  {
    id: 'plot-sv-banana-2',
    originSlug: 'parceiro-sertao-verde',
    productSlug: 'banana',
    label: 'Lote E2 — Banana Prata (parceiro)',
    areaHa: 135,
    status: 'AUDIT',
    polygon: box(SV.lng - STEP, SV.lat - STEP * 0.5, DLNG, DLAT),
    centroid: [SV.lng - STEP, SV.lat - STEP * 0.5],
  },
  // Mandioca farinha — 2 lotes
  {
    id: 'plot-sv-cassava-flour-1',
    originSlug: 'parceiro-sertao-verde',
    productSlug: 'cassava-flour',
    label: 'Lote F1 — Mandioca (farinha)',
    areaHa: 220,
    status: 'PRODUCING',
    polygon: box(SV.lng + STEP * 0.8, SV.lat + STEP * 0.8, DLNG * 1.2, DLAT * 1.2),
    centroid: [SV.lng + STEP * 0.8, SV.lat + STEP * 0.8],
  },
  {
    id: 'plot-sv-cassava-flour-2',
    originSlug: 'parceiro-sertao-verde',
    productSlug: 'cassava-flour',
    label: 'Lote F2 — Mandioca (farinha)',
    areaHa: 190,
    status: 'PRODUCING',
    polygon: box(SV.lng + STEP * 0.8, SV.lat - STEP * 0.6, DLNG * 1.2, DLAT * 1.2),
    centroid: [SV.lng + STEP * 0.8, SV.lat - STEP * 0.6],
  },
  // Mandioca amido — 2 lotes
  {
    id: 'plot-sv-cassava-starch-1',
    originSlug: 'parceiro-sertao-verde',
    productSlug: 'cassava-starch',
    label: 'Lote F3 — Mandioca (amido)',
    areaHa: 180,
    status: 'PRODUCING',
    polygon: box(SV.lng + STEP * 2, SV.lat + STEP * 0.2, DLNG * 1.2, DLAT * 1.2),
    centroid: [SV.lng + STEP * 2, SV.lat + STEP * 0.2],
  },
  {
    id: 'plot-sv-cassava-starch-2',
    originSlug: 'parceiro-sertao-verde',
    productSlug: 'cassava-starch',
    label: 'Lote F4 — Mandioca (amido)',
    areaHa: 150,
    status: 'NEXT_HARVEST',
    polygon: box(SV.lng + STEP * 2, SV.lat - STEP, DLNG * 1.2, DLAT * 1.2),
    centroid: [SV.lng + STEP * 2, SV.lat - STEP],
  },

  // ==================== UNIDADE AGROINDUSTRIAL ====================
  // Polpas — 3 linhas de processamento
  {
    id: 'plot-ai-pulp-mango',
    originSlug: 'unidade-agroindustrial-luma',
    productSlug: 'fruit-pulp',
    label: 'Linha 1 — Polpa de manga',
    areaHa: 4,
    status: 'PRODUCING',
    polygon: box(AI.lng - STEP * 0.5, AI.lat + STEP * 0.3, DLNG * 0.45, DLAT * 0.45),
    centroid: [AI.lng - STEP * 0.5, AI.lat + STEP * 0.3],
  },
  {
    id: 'plot-ai-pulp-guava',
    originSlug: 'unidade-agroindustrial-luma',
    productSlug: 'fruit-pulp',
    label: 'Linha 2 — Polpa de goiaba',
    areaHa: 4,
    status: 'PRODUCING',
    polygon: box(AI.lng - STEP * 0.5, AI.lat - STEP * 0.3, DLNG * 0.45, DLAT * 0.45),
    centroid: [AI.lng - STEP * 0.5, AI.lat - STEP * 0.3],
  },
  {
    id: 'plot-ai-pulp-acerola',
    originSlug: 'unidade-agroindustrial-luma',
    productSlug: 'fruit-pulp',
    label: 'Linha 3 — Polpa de acerola / maracujá',
    areaHa: 4,
    status: 'PRODUCING',
    polygon: box(AI.lng + STEP * 0.3, AI.lat, DLNG * 0.45, DLAT * 0.45),
    centroid: [AI.lng + STEP * 0.3, AI.lat],
  },
  // Açaí — 2 linhas
  {
    id: 'plot-ai-acai-1',
    originSlug: 'unidade-agroindustrial-luma',
    productSlug: 'acai',
    label: 'Linha 4 — Açaí congelado',
    areaHa: 3,
    status: 'PRODUCING',
    polygon: box(AI.lng + STEP, AI.lat + STEP * 0.4, DLNG * 0.45, DLAT * 0.45),
    centroid: [AI.lng + STEP, AI.lat + STEP * 0.4],
  },
  {
    id: 'plot-ai-acai-2',
    originSlug: 'unidade-agroindustrial-luma',
    productSlug: 'acai',
    label: 'Linha 5 — Açaí polpa industrial',
    areaHa: 3,
    status: 'PRODUCING',
    polygon: box(AI.lng + STEP, AI.lat - STEP * 0.4, DLNG * 0.45, DLAT * 0.45),
    centroid: [AI.lng + STEP, AI.lat - STEP * 0.4],
  },
];

export function plotsForProduct(productSlug: string): FieldPlot[] {
  return fieldPlots.filter((p) => p.productSlug === productSlug);
}

export function plotsForOrigin(originSlug: string): FieldPlot[] {
  return fieldPlots.filter((p) => p.originSlug === originSlug);
}
