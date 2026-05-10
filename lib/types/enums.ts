/**
 * String literal unions mirroring the conceptual enums from docs/06.
 *
 * SQLite does not support native Postgres enums, so the Prisma schema
 * stores these as String columns. This file is the canonical TS source
 * of truth for valid values — keep in sync with prisma/schema.prisma
 * comments and lib/status/enums.ts labels.
 *
 * When migrating back to Postgres, restore native enums in the schema
 * and switch imports from `@/lib/types/enums` to `@prisma/client`.
 */

export type UserRole = 'MEMBER' | 'ADMIN';
export const USER_ROLES: readonly UserRole[] = ['MEMBER', 'ADMIN'];

export type VerificationStatus = 'UNVERIFIED' | 'EMAIL_VERIFIED' | 'DOC_VERIFIED';
export const VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  'UNVERIFIED',
  'EMAIL_VERIFIED',
  'DOC_VERIFIED',
];

export type CompanyMemberRole =
  | 'OWNER'
  | 'COMMERCIAL'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'BUYER';
export const COMPANY_MEMBER_ROLES: readonly CompanyMemberRole[] = [
  'OWNER',
  'COMMERCIAL',
  'OPERATIONS',
  'FINANCE',
  'BUYER',
];

export type DealTemplate = 'ONE_OFF' | 'RECURRING' | 'PRODUCT_SUPPLY';
export const DEAL_TEMPLATES: readonly DealTemplate[] = [
  'ONE_OFF',
  'RECURRING',
  'PRODUCT_SUPPLY',
];

export type DealRoomStatus =
  | 'OPENED'
  | 'SCOPED'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'CONFIRMED'
  | 'CLOSED'
  | 'DISPUTED'
  | 'CANCELLED';
export const DEAL_ROOM_STATUSES: readonly DealRoomStatus[] = [
  'OPENED',
  'SCOPED',
  'QUOTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'DELIVERED',
  'CONFIRMED',
  'CLOSED',
  'DISPUTED',
  'CANCELLED',
];

export type DeliveryCycleStatus = 'SCHEDULED' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED';
export const DELIVERY_CYCLE_STATUSES: readonly DeliveryCycleStatus[] = [
  'SCHEDULED',
  'DELIVERED',
  'CONFIRMED',
  'CANCELLED',
];

export type EvidenceKind = 'PHOTO' | 'DOC' | 'SIGNATURE' | 'INVOICE_PREVIEW';
export const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  'PHOTO',
  'DOC',
  'SIGNATURE',
  'INVOICE_PREVIEW',
];

export type VerificationArtifactKind = 'TAX_ID_CARD' | 'ADDRESS_PROOF' | 'OTHER';
export const VERIFICATION_ARTIFACT_KINDS: readonly VerificationArtifactKind[] = [
  'TAX_ID_CARD',
  'ADDRESS_PROOF',
  'OTHER',
];

export type VerificationArtifactStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export const VERIFICATION_ARTIFACT_STATUSES: readonly VerificationArtifactStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
];
