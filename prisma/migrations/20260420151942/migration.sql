-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "StaffTeam" AS ENUM ('COMMERCIAL', 'OPERATIONS', 'COMPLIANCE', 'ADMIN');

-- CreateEnum
CREATE TYPE "BuyerCompanyType" AS ENUM ('IMPORTER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAIL', 'INDUSTRY', 'TRADER');

-- CreateEnum
CREATE TYPE "PortKind" AS ENUM ('SEAPORT', 'AIRPORT', 'INLAND');

-- CreateEnum
CREATE TYPE "OriginKind" AS ENUM ('OWN_FARM', 'AUDITED_PARTNER', 'AGROINDUSTRIAL_UNIT');

-- CreateEnum
CREATE TYPE "RouteModality" AS ENUM ('ROAD', 'RAIL', 'SEA', 'AIR', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "RecommendedContainerKind" AS ENUM ('REEFER_20', 'REEFER_40', 'REEFER_40_HC', 'DRY_20', 'DRY_40');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE_NOW', 'PRE_RESERVE_OPEN', 'UNDER_TECHNICAL_VALIDATION', 'LIMITED_AVAILABILITY', 'UNDER_CONSULTATION', 'NOT_AVAILABLE_FOR_DESTINATION');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FieldStage" AS ENUM ('PRE_PLANTING', 'PLANTED', 'GROWING', 'FLOWERING', 'FRUITING', 'HARVEST', 'POST_HARVEST');

-- CreateEnum
CREATE TYPE "ComplianceGateStatus" AS ENUM ('PREVIEW_AVAILABLE', 'REQUIREMENTS_PENDING', 'DOCUMENTATION_REQUIRED', 'SUBJECT_TO_FINAL_VALIDATION', 'BLOCKED', 'CLEARED_INTERNALLY');

-- CreateEnum
CREATE TYPE "ContainerCode" AS ENUM ('C_20_RF', 'C_40_RF', 'C_40_HC_RF', 'C_20_DR', 'C_40_DR');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_COMMERCIAL_REVIEW', 'UNDER_OPERATIONAL_REVIEW', 'DOCUMENTATION_REVIEW_REQUIRED', 'ADJUSTMENT_REQUESTED', 'APPROVED_FOR_NEGOTIATION', 'REJECTED', 'CONVERTED_TO_OPERATION');

-- CreateEnum
CREATE TYPE "ProposalNoteKind" AS ENUM ('INTERNAL', 'TO_BUYER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-br',
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "buyer_companies" (
    "id" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT,
    "type" "BuyerCompanyType" NOT NULL,
    "countryIso2" CHAR(2) NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "defaultPortId" UUID,
    "defaultIncoterm" TEXT,
    "estimatedMonthlyVolume" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "team" "StaffTeam" NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "iso2" CHAR(2) NOT NULL,
    "iso3" CHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "flagAsset" TEXT,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("iso2")
);

-- CreateTable
CREATE TABLE "ports" (
    "id" UUID NOT NULL,
    "countryIso2" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "kind" "PortKind" NOT NULL DEFAULT 'SEAPORT',

    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "origin_regions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "centroidLat" DOUBLE PRECISION,
    "centroidLng" DOUBLE PRECISION,
    "bboxJson" JSONB,

    CONSTRAINT "origin_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "origins" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "OriginKind" NOT NULL,
    "regionId" UUID NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "statusBlurb" TEXT,
    "approvedCertifications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_plots" (
    "id" UUID NOT NULL,
    "originId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "areaHa" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "field_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_houses" (
    "id" UUID NOT NULL,
    "originId" UUID,
    "name" TEXT NOT NULL,
    "capacityBlurb" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "packing_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cold_chambers" (
    "id" UUID NOT NULL,
    "originId" UUID,
    "name" TEXT NOT NULL,
    "capacityBlurb" TEXT,
    "tempRangeC" TEXT,

    CONSTRAINT "cold_chambers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_hubs" (
    "id" UUID NOT NULL,
    "originId" UUID,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "logistics_hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" UUID NOT NULL,
    "originId" UUID NOT NULL,
    "portId" UUID NOT NULL,
    "modality" "RouteModality" NOT NULL DEFAULT 'ROAD',
    "notes" TEXT,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "heroImage" TEXT,
    "tempRangeMinC" DOUBLE PRECISION,
    "tempRangeMaxC" DOUBLE PRECISION,
    "shelfLifeDaysMin" INTEGER,
    "shelfLifeDaysMax" INTEGER,
    "recommendedContainerKind" "RecommendedContainerKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "varieties" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "boxWeightKg" DOUBLE PRECISION NOT NULL,
    "boxDimensions" TEXT,
    "palletConfig" TEXT,

    CONSTRAINT "varieties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availabilities" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "varietyId" UUID,
    "originId" UUID NOT NULL,
    "volumeTonsBand" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_windows" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "varietyId" UUID,
    "originId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,

    CONSTRAINT "harvest_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_updates" (
    "id" UUID NOT NULL,
    "originId" UUID NOT NULL,
    "fieldPlotId" UUID,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "stage" "FieldStage" NOT NULL,
    "conditionNote" TEXT,
    "riskSummary" TEXT,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_photos" (
    "id" UUID NOT NULL,
    "fieldUpdateId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "caption" TEXT,
    "approvedForBuyerView" BOOLEAN NOT NULL DEFAULT false,
    "approvedByUserId" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_requirements" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phytosanitary_requirements" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "countryIso2" CHAR(2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "phytosanitary_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phytosanitary_requirement_items" (
    "id" UUID NOT NULL,
    "phytosanitaryRequirementId" UUID NOT NULL,
    "documentRequirementId" UUID NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "phytosanitary_requirement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_gates" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "countryIso2" CHAR(2) NOT NULL,
    "status" "ComplianceGateStatus" NOT NULL DEFAULT 'PREVIEW_AVAILABLE',
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "container_types" (
    "id" UUID NOT NULL,
    "code" "ContainerCode" NOT NULL,
    "displayName" TEXT NOT NULL,
    "internalLengthM" DOUBLE PRECISION NOT NULL,
    "internalWidthM" DOUBLE PRECISION NOT NULL,
    "internalHeightM" DOUBLE PRECISION NOT NULL,
    "maxPayloadKg" DOUBLE PRECISION NOT NULL,
    "supportsReefer" BOOLEAN NOT NULL DEFAULT false,
    "defaultTempC" DOUBLE PRECISION,

    CONSTRAINT "container_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_plans" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "containerTypeId" UUID NOT NULL,
    "configuredTempC" DOUBLE PRECISION,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "load_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "load_items" (
    "id" UUID NOT NULL,
    "loadPlanId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "varietyId" UUID,
    "qtyBoxes" INTEGER NOT NULL,
    "qtyPallets" INTEGER NOT NULL,
    "totalWeightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "load_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "buyerCompanyId" UUID NOT NULL,
    "destinationCountryIso" CHAR(2) NOT NULL,
    "destinationPortId" UUID,
    "incoterm" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_notes" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "team" "StaffTeam",
    "body" TEXT NOT NULL,
    "kind" "ProposalNoteKind" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "actorId" UUID,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "diffJson" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_userId_key" ON "buyers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_userId_key" ON "staff_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso3_key" ON "countries"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "ports_countryIso2_code_key" ON "ports"("countryIso2", "code");

-- CreateIndex
CREATE UNIQUE INDEX "origin_regions_name_key" ON "origin_regions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "origins_slug_key" ON "origins"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "routes_originId_portId_modality_key" ON "routes"("originId", "portId", "modality");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "varieties_productId_name_key" ON "varieties"("productId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "document_requirements_code_key" ON "document_requirements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "phytosanitary_requirements_productId_countryIso2_key" ON "phytosanitary_requirements"("productId", "countryIso2");

-- CreateIndex
CREATE UNIQUE INDEX "phytosanitary_requirement_items_phytosanitaryRequirementId__key" ON "phytosanitary_requirement_items"("phytosanitaryRequirementId", "documentRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_gates_productId_countryIso2_key" ON "compliance_gates"("productId", "countryIso2");

-- CreateIndex
CREATE UNIQUE INDEX "container_types_code_key" ON "container_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "load_plans_proposalId_key" ON "load_plans"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_reference_key" ON "proposals"("reference");

-- CreateIndex
CREATE INDEX "audit_events_entity_entityId_idx" ON "audit_events"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_occurredAt_idx" ON "audit_events"("occurredAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_companies" ADD CONSTRAINT "buyer_companies_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "countries"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_companies" ADD CONSTRAINT "buyer_companies_defaultPortId_fkey" FOREIGN KEY ("defaultPortId") REFERENCES "ports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "buyer_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ports" ADD CONSTRAINT "ports_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "countries"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "origins" ADD CONSTRAINT "origins_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "origin_regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_plots" ADD CONSTRAINT "field_plots_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_houses" ADD CONSTRAINT "packing_houses_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cold_chambers" ADD CONSTRAINT "cold_chambers_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_hubs" ADD CONSTRAINT "logistics_hubs_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "varieties" ADD CONSTRAINT "varieties_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_windows" ADD CONSTRAINT "harvest_windows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_windows" ADD CONSTRAINT "harvest_windows_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_windows" ADD CONSTRAINT "harvest_windows_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_updates" ADD CONSTRAINT "field_updates_originId_fkey" FOREIGN KEY ("originId") REFERENCES "origins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_updates" ADD CONSTRAINT "field_updates_fieldPlotId_fkey" FOREIGN KEY ("fieldPlotId") REFERENCES "field_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_photos" ADD CONSTRAINT "field_photos_fieldUpdateId_fkey" FOREIGN KEY ("fieldUpdateId") REFERENCES "field_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_photos" ADD CONSTRAINT "field_photos_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phytosanitary_requirements" ADD CONSTRAINT "phytosanitary_requirements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phytosanitary_requirements" ADD CONSTRAINT "phytosanitary_requirements_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "countries"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phytosanitary_requirement_items" ADD CONSTRAINT "phytosanitary_requirement_items_phytosanitaryRequirementId_fkey" FOREIGN KEY ("phytosanitaryRequirementId") REFERENCES "phytosanitary_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phytosanitary_requirement_items" ADD CONSTRAINT "phytosanitary_requirement_items_documentRequirementId_fkey" FOREIGN KEY ("documentRequirementId") REFERENCES "document_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_gates" ADD CONSTRAINT "compliance_gates_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_gates" ADD CONSTRAINT "compliance_gates_countryIso2_fkey" FOREIGN KEY ("countryIso2") REFERENCES "countries"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plans" ADD CONSTRAINT "load_plans_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_plans" ADD CONSTRAINT "load_plans_containerTypeId_fkey" FOREIGN KEY ("containerTypeId") REFERENCES "container_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_items" ADD CONSTRAINT "load_items_loadPlanId_fkey" FOREIGN KEY ("loadPlanId") REFERENCES "load_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_items" ADD CONSTRAINT "load_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "load_items" ADD CONSTRAINT "load_items_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "varieties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_buyerCompanyId_fkey" FOREIGN KEY ("buyerCompanyId") REFERENCES "buyer_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_destinationCountryIso_fkey" FOREIGN KEY ("destinationCountryIso") REFERENCES "countries"("iso2") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_destinationPortId_fkey" FOREIGN KEY ("destinationPortId") REFERENCES "ports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_notes" ADD CONSTRAINT "proposal_notes_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_notes" ADD CONSTRAINT "proposal_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_proposal_fk" FOREIGN KEY ("entityId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
