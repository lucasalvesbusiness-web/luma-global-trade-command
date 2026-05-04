/**
 * Contratos dos repositórios. A camada de aplicação (serviços + tRPC) só
 * conhece essas interfaces. Implementações concretas ficam em
 * server/repositories/prisma/*.ts.
 */

import type {
  AvailabilityStatus,
  AvailabilitySummary,
  CompliancePreview,
  CountrySummary,
  FieldUpdateSummary,
  HarvestWindowSummary,
  OriginSummary,
  PortSummary,
  ProductDetail,
  ProductSummary,
  ProposalDetail,
  ProposalListItem,
  ProposalNoteKind,
  ProposalNoteSummary,
  ProposalStatus,
  StaffTeam,
} from './types';

export interface CatalogRepository {
  listProducts(): Promise<ProductSummary[]>;
  findProductBySlug(slug: string): Promise<ProductDetail | null>;
  listByCategory(categorySlug: string): Promise<ProductSummary[]>;
}

export interface GeoRepository {
  listCountries(): Promise<CountrySummary[]>;
  portsByCountry(iso2: string): Promise<PortSummary[]>;
  listOrigins(): Promise<OriginSummary[]>;
}

export interface AvailabilityRepository {
  listForProduct(
    productSlug: string,
    opts?: { statuses?: AvailabilityStatus[] },
  ): Promise<AvailabilitySummary[]>;
  listAll(opts?: { statuses?: AvailabilityStatus[] }): Promise<AvailabilitySummary[]>;
  harvestWindowsForProduct(productSlug: string): Promise<HarvestWindowSummary[]>;
}

export interface ComplianceRepository {
  previewFor(productSlug: string, countryIso2: string): Promise<CompliancePreview | null>;
  previewsForCountry(countryIso2: string): Promise<CompliancePreview[]>;
}

export interface FieldRepository {
  /** Último field update por origem (entre as origens informadas). */
  latestByOriginSlugs(originSlugs: string[]): Promise<FieldUpdateSummary[]>;
}

export interface ProposalRepository {
  list(opts?: {
    statuses?: ProposalStatus[];
    companyIds?: string[];
  }): Promise<ProposalListItem[]>;
  findById(id: string): Promise<ProposalDetail | null>;
  findByReference(reference: string): Promise<ProposalDetail | null>;
  updateStatus(input: {
    proposalId: string;
    fromStatus: ProposalStatus;
    toStatus: ProposalStatus;
    actorUserId: string;
    actorTeam: StaffTeam | null;
    note?: { body: string; kind: ProposalNoteKind } | null;
  }): Promise<void>;
  addNote(input: {
    proposalId: string;
    authorUserId: string;
    authorTeam: StaffTeam | null;
    body: string;
    kind: ProposalNoteKind;
  }): Promise<ProposalNoteSummary>;
}
