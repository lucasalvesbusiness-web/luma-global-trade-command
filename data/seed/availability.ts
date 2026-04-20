/**
 * Disponibilidade e janelas de colheita por produto × origem.
 *
 * Regras de negócio ativas aqui:
 * R6 — estoque sempre em faixa (band), nunca número exato
 * R7 — alguns produtos ficam "UNDER_CONSULTATION" para destinos específicos
 *
 * As datas são relativas (offsets em dias a partir da data de seed).
 */

export type SeedAvailabilityStatus =
  | 'AVAILABLE_NOW'
  | 'PRE_RESERVE_OPEN'
  | 'UNDER_TECHNICAL_VALIDATION'
  | 'LIMITED_AVAILABILITY'
  | 'UNDER_CONSULTATION';

export type SeedConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type SeedAvailability = {
  productSlug: string;
  varietyName: string | null;
  originSlug: string;
  volumeTonsBand: string; // ex.: "20–40 t"
  status: SeedAvailabilityStatus;
  validFromDaysOffset: number;
  validToDaysOffset: number;
  notesPtBr?: string;
  notesEn?: string;
};

export const seedAvailabilities: SeedAvailability[] = [
  // ----- Mango -----
  {
    productSlug: 'mango',
    varietyName: 'Palmer',
    originSlug: 'fazenda-luma-vale-norte',
    volumeTonsBand: '30–40 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 45,
    notesPtBr: '38 t em estoque atual; 54 t adicionais na próxima janela.',
    notesEn: '38 t current stock; 54 t additional next window.',
  },
  {
    productSlug: 'mango',
    varietyName: 'Tommy Atkins',
    originSlug: 'fazenda-luma-vale-norte',
    volumeTonsBand: '20–30 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 45,
  },
  {
    productSlug: 'mango',
    varietyName: 'Kent',
    originSlug: 'fazenda-luma-rio-claro',
    volumeTonsBand: '10–20 t',
    status: 'PRE_RESERVE_OPEN',
    validFromDaysOffset: 14,
    validToDaysOffset: 75,
  },

  // ----- Grape -----
  {
    productSlug: 'grape',
    varietyName: 'Sweet Globe',
    originSlug: 'fazenda-luma-vale-norte',
    volumeTonsBand: '15–25 t',
    status: 'UNDER_CONSULTATION',
    validFromDaysOffset: 45,
    validToDaysOffset: 120,
    notesPtBr: 'Próxima colheita em ~45 dias — volume fechado sob consulta.',
    notesEn: 'Next harvest in ~45 days — volume subject to consultation.',
  },
  {
    productSlug: 'grape',
    varietyName: 'Thompson',
    originSlug: 'fazenda-luma-vale-norte',
    volumeTonsBand: '15–25 t',
    status: 'UNDER_TECHNICAL_VALIDATION',
    validFromDaysOffset: 45,
    validToDaysOffset: 120,
  },
  {
    productSlug: 'grape',
    varietyName: 'Crimson',
    originSlug: 'fazenda-luma-vale-norte',
    volumeTonsBand: '20–40 t',
    status: 'PRE_RESERVE_OPEN',
    validFromDaysOffset: 50,
    validToDaysOffset: 130,
  },

  // ----- Banana -----
  {
    productSlug: 'banana',
    varietyName: 'Prata',
    originSlug: 'fazenda-luma-rio-claro',
    volumeTonsBand: '25–40 t',
    status: 'LIMITED_AVAILABILITY',
    validFromDaysOffset: 0,
    validToDaysOffset: 60,
    notesPtBr: 'Oferta limitada — priorizamos compradores recorrentes.',
    notesEn: 'Limited supply — repeat buyers prioritized.',
  },
  {
    productSlug: 'banana',
    varietyName: 'Cavendish',
    originSlug: 'parceiro-sertao-verde',
    volumeTonsBand: '15–25 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 45,
  },

  // ----- Fruit pulp -----
  {
    productSlug: 'fruit-pulp',
    varietyName: 'Mango pulp',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '10–20 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 180,
    notesPtBr: 'Processamento contínuo — volume renovável.',
    notesEn: 'Continuous processing — renewable volume.',
  },
  {
    productSlug: 'fruit-pulp',
    varietyName: 'Acerola pulp',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '5–15 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 180,
  },

  // ----- Açaí -----
  {
    productSlug: 'acai',
    varietyName: 'Bag-in-box 10 kg',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '5–10 t',
    status: 'UNDER_CONSULTATION',
    validFromDaysOffset: 0,
    validToDaysOffset: 120,
    notesPtBr: 'Janela sazonal — confirme volume e data com a Luma.',
    notesEn: 'Seasonal window — confirm volume and dates with Luma.',
  },

  // ----- Cassava flour -----
  {
    productSlug: 'cassava-flour',
    varietyName: 'Fine',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '60–100 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 365,
  },
  {
    productSlug: 'cassava-flour',
    varietyName: 'Coarse',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '40–80 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 365,
  },

  // ----- Cassava starch -----
  {
    productSlug: 'cassava-starch',
    varietyName: 'Sweet (polvilho doce)',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '80–120 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 365,
  },
  {
    productSlug: 'cassava-starch',
    varietyName: 'Sour (polvilho azedo)',
    originSlug: 'unidade-agroindustrial-luma',
    volumeTonsBand: '40–80 t',
    status: 'AVAILABLE_NOW',
    validFromDaysOffset: 0,
    validToDaysOffset: 365,
  },
];

/**
 * Janelas de colheita (HarvestWindow) — onde produto/variedade ainda
 * não está plenamente disponível mas tem projeção de colheita.
 */
export type SeedHarvestWindow = {
  productSlug: string;
  varietyName: string | null;
  originSlug: string;
  startDaysOffset: number;
  endDaysOffset: number;
  confidence: SeedConfidence;
  notesPtBr?: string;
  notesEn?: string;
};

export const seedHarvestWindows: SeedHarvestWindow[] = [
  {
    productSlug: 'mango',
    varietyName: 'Palmer',
    originSlug: 'fazenda-luma-vale-norte',
    startDaysOffset: 30,
    endDaysOffset: 75,
    confidence: 'HIGH',
  },
  {
    productSlug: 'mango',
    varietyName: 'Kent',
    originSlug: 'fazenda-luma-rio-claro',
    startDaysOffset: 45,
    endDaysOffset: 95,
    confidence: 'MEDIUM',
  },
  {
    productSlug: 'grape',
    varietyName: 'Sweet Globe',
    originSlug: 'fazenda-luma-vale-norte',
    startDaysOffset: 60,
    endDaysOffset: 120,
    confidence: 'MEDIUM',
  },
  {
    productSlug: 'grape',
    varietyName: 'Thompson',
    originSlug: 'fazenda-luma-vale-norte',
    startDaysOffset: 60,
    endDaysOffset: 120,
    confidence: 'MEDIUM',
  },
  {
    productSlug: 'banana',
    varietyName: 'Prata',
    originSlug: 'fazenda-luma-rio-claro',
    startDaysOffset: 0,
    endDaysOffset: 60,
    confidence: 'HIGH',
  },
];

/** FieldUpdate seed — status visual do campo (para Field View em F4). */
export type SeedFieldStage =
  | 'PRE_PLANTING'
  | 'PLANTED'
  | 'GROWING'
  | 'FLOWERING'
  | 'FRUITING'
  | 'HARVEST'
  | 'POST_HARVEST';

export type SeedFieldUpdate = {
  originSlug: string;
  observedDaysOffset: number;
  stage: SeedFieldStage;
  conditionNotePtBr?: string;
  conditionNoteEn?: string;
  riskSummaryPtBr?: string;
  riskSummaryEn?: string;
  confidence: SeedConfidence;
};

export const seedFieldUpdates: SeedFieldUpdate[] = [
  {
    originSlug: 'fazenda-luma-vale-norte',
    observedDaysOffset: -3,
    stage: 'FRUITING',
    conditionNotePtBr:
      'Irrigação normal. Calibração e coloração dentro do padrão comercial.',
    conditionNoteEn:
      'Normal irrigation. Caliber and coloring within commercial standard.',
    riskSummaryPtBr: 'Baixo — janela favorável nas próximas 2 semanas.',
    riskSummaryEn: 'Low — favorable window in the next 2 weeks.',
    confidence: 'HIGH',
  },
  {
    originSlug: 'fazenda-luma-rio-claro',
    observedDaysOffset: -5,
    stage: 'GROWING',
    conditionNotePtBr: 'Talhões de manga Kent em crescimento constante.',
    conditionNoteEn: 'Kent mango plots in consistent growth.',
    riskSummaryPtBr: 'Médio — monitoramento semanal ativo.',
    riskSummaryEn: 'Medium — weekly monitoring active.',
    confidence: 'MEDIUM',
  },
  {
    originSlug: 'parceiro-sertao-verde',
    observedDaysOffset: -7,
    stage: 'HARVEST',
    conditionNotePtBr: 'Auditoria mensal em dia. Packing operando a 85% de capacidade.',
    conditionNoteEn: 'Monthly audit up to date. Packing operating at 85% capacity.',
    riskSummaryPtBr: 'Baixo.',
    riskSummaryEn: 'Low.',
    confidence: 'HIGH',
  },
  {
    originSlug: 'unidade-agroindustrial-luma',
    observedDaysOffset: -1,
    stage: 'POST_HARVEST',
    conditionNotePtBr: 'Linhas de polpa e farinha operando normalmente.',
    conditionNoteEn: 'Pulp and flour lines operating normally.',
    riskSummaryPtBr: 'Baixo.',
    riskSummaryEn: 'Low.',
    confidence: 'HIGH',
  },
];
