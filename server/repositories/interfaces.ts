import type {
  Company,
  CompanyMember,
  CompanyMemberRole,
  DealTemplate,
  ServiceOffering,
  VerificationArtifact,
  VerificationArtifactKind,
  VerificationArtifactStatus,
  VerificationStatus,
} from '@prisma/client';

export type CompanyWithRelations = Company & {
  members: CompanyMember[];
  offerings: ServiceOffering[];
};

export type CreateCompanyInput = {
  legalName: string;
  tradeName?: string;
  taxId: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  serviceRadiusKm?: number;
  ownerUserId: string;
  offerings: Array<{
    category: string;
    subcategory?: string;
    modality: DealTemplate;
    description?: string;
  }>;
};

export type UpdateCompanyInput = Partial<{
  tradeName: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number | null;
}>;

export interface CompanyRepository {
  findById(id: string): Promise<CompanyWithRelations | null>;
  findBySlug(slug: string): Promise<CompanyWithRelations | null>;
  findByTaxId(taxId: string): Promise<Company | null>;
  create(input: CreateCompanyInput): Promise<CompanyWithRelations>;
  update(id: string, input: UpdateCompanyInput): Promise<Company>;
  setVerificationStatus(id: string, status: VerificationStatus): Promise<Company>;
  listForUser(userId: string): Promise<
    Array<{ company: Company; role: CompanyMemberRole }>
  >;
}

export type CreateArtifactInput = {
  companyId: string;
  kind: VerificationArtifactKind;
  url: string;
  hash?: string;
  notes?: string;
  uploadedById: string;
};

export interface VerificationArtifactRepository {
  create(input: CreateArtifactInput): Promise<VerificationArtifact>;
  listPending(): Promise<Array<VerificationArtifact & { company: Company }>>;
  findById(id: string): Promise<VerificationArtifact | null>;
  setStatus(
    id: string,
    status: VerificationArtifactStatus,
    reviewedById: string,
    notes?: string,
  ): Promise<VerificationArtifact>;
}
