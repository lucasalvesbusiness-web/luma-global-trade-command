/**
 * PT-BR / EN labels for operational enums of the B2B trust network.
 * Backend uses Prisma enum codes; UI consumes these labels by locale.
 * Canonical reference: docs/06-operational-ontology-and-object-model.md
 */

import type { Locale } from '@/lib/i18n/config';

export type StatusLabel = Record<Locale, string>;

export const verificationStatusLabels: Record<string, StatusLabel> = {
  UNVERIFIED: { 'pt-br': 'Não verificada', en: 'Unverified' },
  EMAIL_VERIFIED: { 'pt-br': 'Email verificado', en: 'Email verified' },
  DOC_VERIFIED: { 'pt-br': 'Documentação verificada', en: 'Documentation verified' },
};

export const dealTemplateLabels: Record<string, StatusLabel> = {
  ONE_OFF: { 'pt-br': 'Serviço pontual', en: 'One-off service' },
  RECURRING: { 'pt-br': 'Serviço recorrente', en: 'Recurring service' },
  PRODUCT_SUPPLY: { 'pt-br': 'Fornecimento de produto', en: 'Product supply' },
};

export const dealRoomStatusLabels: Record<string, StatusLabel> = {
  OPENED: { 'pt-br': 'Aberto', en: 'Opened' },
  SCOPED: { 'pt-br': 'Escopo definido', en: 'Scoped' },
  QUOTED: { 'pt-br': 'Cotado', en: 'Quoted' },
  ACCEPTED: { 'pt-br': 'Aceito', en: 'Accepted' },
  IN_PROGRESS: { 'pt-br': 'Em execução', en: 'In progress' },
  DELIVERED: { 'pt-br': 'Entregue', en: 'Delivered' },
  CONFIRMED: { 'pt-br': 'Confirmado', en: 'Confirmed' },
  CLOSED: { 'pt-br': 'Encerrado', en: 'Closed' },
  DISPUTED: { 'pt-br': 'Em disputa', en: 'Disputed' },
  CANCELLED: { 'pt-br': 'Cancelado', en: 'Cancelled' },
};
