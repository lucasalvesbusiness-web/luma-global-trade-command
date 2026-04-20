/**
 * Labels PT-BR e EN para os enums operacionais do Luma Global Trade Command.
 * O backend usa os códigos dos enums do Prisma; a UI usa estes labels por idioma.
 * Referência canônica: docs/06-operational-ontology-and-object-model.md
 */

import type { Locale } from '@/lib/i18n/config';

export type StatusLabel = Record<Locale, string>;

export const availabilityStatusLabels: Record<string, StatusLabel> = {
  AVAILABLE_NOW: { 'pt-br': 'Disponível agora', en: 'Available now' },
  PRE_RESERVE_OPEN: { 'pt-br': 'Pré-reserva aberta', en: 'Pre-reserve open' },
  UNDER_TECHNICAL_VALIDATION: {
    'pt-br': 'Em validação técnica',
    en: 'Under technical validation',
  },
  LIMITED_AVAILABILITY: {
    'pt-br': 'Disponibilidade limitada',
    en: 'Limited availability',
  },
  UNDER_CONSULTATION: { 'pt-br': 'Sob consulta', en: 'Under consultation' },
  NOT_AVAILABLE_FOR_DESTINATION: {
    'pt-br': 'Não disponível para este destino',
    en: 'Not available for this destination',
  },
};

export const proposalStatusLabels: Record<string, StatusLabel> = {
  DRAFT: { 'pt-br': 'Rascunho', en: 'Draft' },
  SUBMITTED: { 'pt-br': 'Enviada', en: 'Submitted' },
  UNDER_COMMERCIAL_REVIEW: {
    'pt-br': 'Em análise comercial',
    en: 'Under commercial review',
  },
  UNDER_OPERATIONAL_REVIEW: {
    'pt-br': 'Em análise operacional',
    en: 'Under operational review',
  },
  DOCUMENTATION_REVIEW_REQUIRED: {
    'pt-br': 'Revisão documental necessária',
    en: 'Documentation review required',
  },
  ADJUSTMENT_REQUESTED: { 'pt-br': 'Ajuste solicitado', en: 'Adjustment requested' },
  APPROVED_FOR_NEGOTIATION: {
    'pt-br': 'Aprovada para negociação',
    en: 'Approved for negotiation',
  },
  REJECTED: { 'pt-br': 'Rejeitada', en: 'Rejected' },
  CONVERTED_TO_OPERATION: {
    'pt-br': 'Convertida em operação',
    en: 'Converted to operation',
  },
};

export const complianceGateStatusLabels: Record<string, StatusLabel> = {
  PREVIEW_AVAILABLE: { 'pt-br': 'Prévia disponível', en: 'Preview available' },
  REQUIREMENTS_PENDING: { 'pt-br': 'Requisitos pendentes', en: 'Requirements pending' },
  DOCUMENTATION_REQUIRED: {
    'pt-br': 'Documentação requerida',
    en: 'Documentation required',
  },
  SUBJECT_TO_FINAL_VALIDATION: {
    'pt-br': 'Sujeito à validação final',
    en: 'Subject to final validation',
  },
  BLOCKED: { 'pt-br': 'Bloqueado', en: 'Blocked' },
  CLEARED_INTERNALLY: {
    'pt-br': 'Liberado internamente',
    en: 'Cleared internally',
  },
};
