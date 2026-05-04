/**
 * Tipos compartilhados das camadas de repositório.
 *
 * Princípio do plano (doc 12 §3.1): serviços e rotas NÃO importam Prisma
 * direto. Eles usam essas interfaces. A implementação atual é Prisma;
 * no futuro podemos trocar por ERP/WMS sem tocar em UI ou tRPC.
 */

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  categorySlug: string;
  tempRangeMinC: number | null;
  tempRangeMaxC: number | null;
  shelfLifeDaysMin: number | null;
  shelfLifeDaysMax: number | null;
  recommendedContainerKind:
    | 'REEFER_20'
    | 'REEFER_40'
    | 'REEFER_40_HC'
    | 'DRY_20'
    | 'DRY_40';
  heroImage: string | null;
};

export type ProductDetail = ProductSummary & {
  varieties: {
    id: string;
    name: string;
    boxWeightKg: number;
    boxDimensions: string | null;
    palletConfig: string | null;
  }[];
};

export type AvailabilityStatus =
  | 'AVAILABLE_NOW'
  | 'PRE_RESERVE_OPEN'
  | 'UNDER_TECHNICAL_VALIDATION'
  | 'LIMITED_AVAILABILITY'
  | 'UNDER_CONSULTATION'
  | 'NOT_AVAILABLE_FOR_DESTINATION';

export type AvailabilitySummary = {
  id: string;
  productSlug: string;
  productName: string;
  varietyName: string | null;
  originSlug: string;
  originName: string;
  volumeTonsBand: string;
  status: AvailabilityStatus;
  validFrom: Date;
  validTo: Date;
  notes: string | null;
};

export type HarvestWindowSummary = {
  productSlug: string;
  varietyName: string | null;
  originSlug: string;
  startDate: Date;
  endDate: Date;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string | null;
};

export type CountrySummary = {
  iso2: string;
  iso3: string;
  name: string;
  region: string | null;
};

export type PortSummary = {
  id: string;
  code: string | null;
  name: string;
  countryIso2: string;
};

export type OriginSummary = {
  id: string;
  slug: string;
  name: string;
  kind: 'OWN_FARM' | 'AUDITED_PARTNER' | 'AGROINDUSTRIAL_UNIT';
  lat: number | null;
  lng: number | null;
  statusBlurb: string | null;
  approvedCertifications: string[];
};

export type CompliancePreview = {
  productSlug: string;
  productName: string;
  countryIso2: string;
  countryName: string;
  status:
    | 'PREVIEW_AVAILABLE'
    | 'REQUIREMENTS_PENDING'
    | 'DOCUMENTATION_REQUIRED'
    | 'SUBJECT_TO_FINAL_VALIDATION'
    | 'BLOCKED'
    | 'CLEARED_INTERNALLY';
  documents: {
    code: string;
    name: string;
  }[];
  notes: string | null;
};

export type FieldStage =
  | 'PRE_PLANTING'
  | 'PLANTED'
  | 'GROWING'
  | 'FLOWERING'
  | 'FRUITING'
  | 'HARVEST'
  | 'POST_HARVEST';

export type FieldUpdateSummary = {
  id: string;
  originSlug: string;
  originName: string;
  observedAt: Date;
  stage: FieldStage;
  conditionNote: string | null;
  riskSummary: string | null;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  originLat: number | null;
  originLng: number | null;
};

export type PassportData = {
  product: ProductDetail;
  availabilities: AvailabilitySummary[];
  harvestWindows: HarvestWindowSummary[];
  fieldUpdates: FieldUpdateSummary[]; // último por origem que tem availability do produto
};

export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_COMMERCIAL_REVIEW'
  | 'UNDER_OPERATIONAL_REVIEW'
  | 'DOCUMENTATION_REVIEW_REQUIRED'
  | 'ADJUSTMENT_REQUESTED'
  | 'APPROVED_FOR_NEGOTIATION'
  | 'REJECTED'
  | 'CONVERTED_TO_OPERATION';

export type StaffTeam = 'COMMERCIAL' | 'OPERATIONS' | 'COMPLIANCE' | 'ADMIN';

export type ProposalNoteKind = 'INTERNAL' | 'TO_BUYER' | 'FROM_BUYER';

export type ProposalListItem = {
  id: string;
  reference: string;
  status: ProposalStatus;
  incoterm: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  buyerCompany: {
    id: string;
    legalName: string;
    displayName: string | null;
    countryIso2: string;
    type: string;
  };
  destinationCountry: {
    iso2: string;
    name: string;
  };
  destinationPort: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  loadPlan: {
    containerCode: string;
    configuredTempC: number | null;
    itemsCount: number;
    totalBoxes: number;
    totalPallets: number;
    totalWeightKg: number;
  } | null;
};

export type ProposalNoteSummary = {
  id: string;
  authorName: string | null;
  authorEmail: string;
  team: StaffTeam | null;
  kind: ProposalNoteKind;
  body: string;
  createdAt: Date;
};

export type ProposalAuditEvent = {
  id: string;
  actorName: string | null;
  actorEmail: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  occurredAt: Date;
};

export type ProposalLoadItem = {
  id: string;
  productSlug: string;
  productName: string;
  varietyName: string | null;
  qtyBoxes: number;
  qtyPallets: number;
  totalWeightKg: number;
};

export type ProposalDetail = ProposalListItem & {
  buyerContactEmail: string | null;
  buyerContactName: string | null;
  buyerCity: string | null;
  buyerAddress: string | null;
  items: ProposalLoadItem[];
  notes: ProposalNoteSummary[];
  auditTrail: ProposalAuditEvent[];
};
