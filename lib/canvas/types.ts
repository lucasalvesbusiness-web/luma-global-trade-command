export type CanvasStage =
  | 'intro'
  | 'destinationSelection'
  | 'destinationConfirmed'
  | 'transitToBrazil'
  | 'originReveal'
  | 'productExploration';

export type Incoterm = 'FOB' | 'CFR' | 'CIF' | 'DAP' | 'DDP';

export const incoterms: readonly Incoterm[] = ['FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;

export type VolumeBand = '1-5' | '5-20' | '20-40' | '40-100' | '100+';

export const volumeBands: readonly {
  value: VolumeBand;
  labelPtBr: string;
  labelEn: string;
}[] = [
  { value: '1-5', labelPtBr: '1–5 toneladas / mês', labelEn: '1–5 tons / month' },
  { value: '5-20', labelPtBr: '5–20 toneladas / mês', labelEn: '5–20 tons / month' },
  { value: '20-40', labelPtBr: '20–40 toneladas / mês', labelEn: '20–40 tons / month' },
  { value: '40-100', labelPtBr: '40–100 toneladas / mês', labelEn: '40–100 tons / month' },
  { value: '100+', labelPtBr: '100+ toneladas / mês', labelEn: '100+ tons / month' },
];

export type DestinationDraft = {
  countryIso2: string | null;
  portId: string | null;
  cityId: string | null;
  incoterm: Incoterm | null;
  volume: VolumeBand | null;
};

export const emptyDestination: DestinationDraft = {
  countryIso2: null,
  portId: null,
  cityId: null,
  incoterm: null,
  volume: null,
};

export type LatLng = { lat: number; lng: number };

// ============================================================
// Load Plan
// ============================================================

export type ContainerCode =
  | 'C_20_RF'
  | 'C_40_RF'
  | 'C_40_HC_RF'
  | 'C_20_DR'
  | 'C_40_DR';

/** Preferência do produto (distinto do código físico do container). */
export type RecommendedContainerKind =
  | 'REEFER_20'
  | 'REEFER_40'
  | 'REEFER_40_HC'
  | 'DRY_20'
  | 'DRY_40';

/** Item do Load Plan — rascunho em memória (não persistido até submeter). */
export type LoadPlanItem = {
  /** id local (uuid de sessão) — diferente do id do banco */
  localId: string;
  productSlug: string;
  productName: string;
  varietyId: string;
  varietyName: string;
  boxWeightKg: number;
  recommendedContainerKind: RecommendedContainerKind;
  tempRangeMinC: number | null;
  tempRangeMaxC: number | null;
  qtyBoxes: number;
  qtyPallets: number;
};

export type LoadPlanDraft = {
  containerCode: ContainerCode | null;
  configuredTempC: number | null;
  items: LoadPlanItem[];
};

export const emptyLoadPlan: LoadPlanDraft = {
  containerCode: null,
  configuredTempC: null,
  items: [],
};

// ============================================================
// Buyer info (capturada na submissão da proposta)
// ============================================================

export type BuyerCompanyType =
  | 'IMPORTER'
  | 'DISTRIBUTOR'
  | 'WHOLESALER'
  | 'RETAIL'
  | 'INDUSTRY'
  | 'TRADER';

export type BuyerDraft = {
  legalName: string;
  displayName: string | null;
  type: BuyerCompanyType | null;
  city: string | null;
  address: string | null;
  contactName: string;
  contactEmail: string;
  buyerNote: string | null;
};

export const emptyBuyer: BuyerDraft = {
  legalName: '',
  displayName: null,
  type: null,
  city: null,
  address: null,
  contactName: '',
  contactEmail: '',
  buyerNote: null,
};

export const buyerCompanyTypes: {
  value: BuyerCompanyType;
  labelPtBr: string;
  labelEn: string;
}[] = [
  { value: 'IMPORTER', labelPtBr: 'Importador', labelEn: 'Importer' },
  { value: 'DISTRIBUTOR', labelPtBr: 'Distribuidor', labelEn: 'Distributor' },
  { value: 'WHOLESALER', labelPtBr: 'Atacadista', labelEn: 'Wholesaler' },
  { value: 'RETAIL', labelPtBr: 'Varejo', labelEn: 'Retail' },
  { value: 'INDUSTRY', labelPtBr: 'Indústria', labelEn: 'Industry' },
  { value: 'TRADER', labelPtBr: 'Trader', labelEn: 'Trader' },
];
