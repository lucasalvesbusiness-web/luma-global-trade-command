/**
 * Factory única de repositórios, bindada à PrismaClient canônica (lib/db).
 * tRPC routers e serviços consomem daqui.
 */

import { db } from '@/lib/db';

import type {
  AvailabilityRepository,
  CatalogRepository,
  ComplianceRepository,
  FieldRepository,
  GeoRepository,
  ProposalRepository,
} from './interfaces';

import { makePrismaAvailabilityRepository } from './prisma/availability';
import { makePrismaCatalogRepository } from './prisma/catalog';
import { makePrismaComplianceRepository } from './prisma/compliance';
import { makePrismaFieldRepository } from './prisma/field';
import { makePrismaGeoRepository } from './prisma/geo';
import { makePrismaProposalRepository } from './prisma/proposal';

export type Repositories = {
  catalog: CatalogRepository;
  geo: GeoRepository;
  availability: AvailabilityRepository;
  compliance: ComplianceRepository;
  field: FieldRepository;
  proposal: ProposalRepository;
};

export const repositories: Repositories = {
  catalog: makePrismaCatalogRepository(db),
  geo: makePrismaGeoRepository(db),
  availability: makePrismaAvailabilityRepository(db),
  compliance: makePrismaComplianceRepository(db),
  field: makePrismaFieldRepository(db),
  proposal: makePrismaProposalRepository(db),
};

export type {
  CatalogRepository,
  GeoRepository,
  AvailabilityRepository,
  ComplianceRepository,
  FieldRepository,
  ProposalRepository,
};
