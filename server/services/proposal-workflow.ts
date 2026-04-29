/**
 * Proposal Workflow — define quais transições de status são permitidas
 * e qual time pode disparar cada uma. Usado pelo Internal Control View.
 *
 * Princípio (doc 06 §3.2): o fluxo é um grafo de estados, não uma lista
 * linear. Cada transição escreve AuditEvent (fonte única de verdade da
 * história da proposta).
 */

import type { ProposalStatus, StaffTeam } from '@/server/repositories/types';

export type TransitionRule = {
  to: ProposalStatus;
  /** Times que podem disparar essa transição. ADMIN pode tudo. */
  allowedTeams: StaffTeam[];
  /** Tag UI (PT + EN). Fica em i18n no cliente; essa é só referência. */
  label: string;
  /** Severidade visual do botão. */
  tone: 'advance' | 'caution' | 'reject' | 'close';
};

/**
 * Mapa de transições: `from` status → lista de próximos status permitidos.
 * COMMERCIAL tria, OPERATIONS valida viabilidade, COMPLIANCE revisa docs.
 * ADMIN pode tudo.
 */
export const transitionMap: Record<ProposalStatus, TransitionRule[]> = {
  DRAFT: [],

  SUBMITTED: [
    {
      to: 'UNDER_COMMERCIAL_REVIEW',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.startCommercialReview',
      tone: 'advance',
    },
    {
      to: 'REJECTED',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.reject',
      tone: 'reject',
    },
  ],

  UNDER_COMMERCIAL_REVIEW: [
    {
      to: 'UNDER_OPERATIONAL_REVIEW',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.sendToOps',
      tone: 'advance',
    },
    {
      to: 'DOCUMENTATION_REVIEW_REQUIRED',
      allowedTeams: ['COMMERCIAL', 'COMPLIANCE', 'ADMIN'],
      label: 'transitions.sendToCompliance',
      tone: 'advance',
    },
    {
      to: 'ADJUSTMENT_REQUESTED',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.requestAdjustment',
      tone: 'caution',
    },
    {
      to: 'REJECTED',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.reject',
      tone: 'reject',
    },
  ],

  UNDER_OPERATIONAL_REVIEW: [
    {
      to: 'DOCUMENTATION_REVIEW_REQUIRED',
      allowedTeams: ['OPERATIONS', 'COMPLIANCE', 'ADMIN'],
      label: 'transitions.sendToCompliance',
      tone: 'advance',
    },
    {
      to: 'APPROVED_FOR_NEGOTIATION',
      allowedTeams: ['OPERATIONS', 'COMMERCIAL', 'ADMIN'],
      label: 'transitions.approveForNegotiation',
      tone: 'advance',
    },
    {
      to: 'ADJUSTMENT_REQUESTED',
      allowedTeams: ['OPERATIONS', 'ADMIN'],
      label: 'transitions.requestAdjustment',
      tone: 'caution',
    },
    {
      to: 'REJECTED',
      allowedTeams: ['OPERATIONS', 'ADMIN'],
      label: 'transitions.reject',
      tone: 'reject',
    },
  ],

  DOCUMENTATION_REVIEW_REQUIRED: [
    {
      to: 'UNDER_OPERATIONAL_REVIEW',
      allowedTeams: ['COMPLIANCE', 'ADMIN'],
      label: 'transitions.backToOps',
      tone: 'advance',
    },
    {
      to: 'APPROVED_FOR_NEGOTIATION',
      allowedTeams: ['COMPLIANCE', 'ADMIN'],
      label: 'transitions.approveForNegotiation',
      tone: 'advance',
    },
    {
      to: 'ADJUSTMENT_REQUESTED',
      allowedTeams: ['COMPLIANCE', 'ADMIN'],
      label: 'transitions.requestAdjustment',
      tone: 'caution',
    },
    {
      to: 'REJECTED',
      allowedTeams: ['COMPLIANCE', 'ADMIN'],
      label: 'transitions.reject',
      tone: 'reject',
    },
  ],

  ADJUSTMENT_REQUESTED: [
    {
      to: 'UNDER_COMMERCIAL_REVIEW',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.resumeCommercial',
      tone: 'advance',
    },
    {
      to: 'REJECTED',
      allowedTeams: ['COMMERCIAL', 'OPERATIONS', 'COMPLIANCE', 'ADMIN'],
      label: 'transitions.reject',
      tone: 'reject',
    },
  ],

  APPROVED_FOR_NEGOTIATION: [
    {
      to: 'CONVERTED_TO_OPERATION',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.convertToOperation',
      tone: 'close',
    },
    {
      to: 'REJECTED',
      allowedTeams: ['COMMERCIAL', 'ADMIN'],
      label: 'transitions.reject',
      tone: 'reject',
    },
  ],

  REJECTED: [],
  CONVERTED_TO_OPERATION: [],
};

export function allowedNextStatuses(
  from: ProposalStatus,
  team: StaffTeam | null,
): TransitionRule[] {
  const rules = transitionMap[from] ?? [];
  if (team === 'ADMIN' || team === null) return rules; // ADMIN vê tudo
  return rules.filter((r) => r.allowedTeams.includes(team));
}

export function isTransitionAllowed(
  from: ProposalStatus,
  to: ProposalStatus,
  team: StaffTeam | null,
): boolean {
  if (team === 'ADMIN') {
    return (transitionMap[from] ?? []).some((r) => r.to === to);
  }
  return (transitionMap[from] ?? []).some(
    (r) => r.to === to && (team === null || r.allowedTeams.includes(team)),
  );
}

/**
 * Status que cada time "se importa". Usado para filtrar o kanban por time.
 */
export const teamRelevantStatuses: Record<StaffTeam, ProposalStatus[]> = {
  COMMERCIAL: [
    'SUBMITTED',
    'UNDER_COMMERCIAL_REVIEW',
    'ADJUSTMENT_REQUESTED',
    'APPROVED_FOR_NEGOTIATION',
  ],
  OPERATIONS: ['UNDER_OPERATIONAL_REVIEW', 'ADJUSTMENT_REQUESTED'],
  COMPLIANCE: ['DOCUMENTATION_REVIEW_REQUIRED'],
  ADMIN: [
    'SUBMITTED',
    'UNDER_COMMERCIAL_REVIEW',
    'UNDER_OPERATIONAL_REVIEW',
    'DOCUMENTATION_REVIEW_REQUIRED',
    'ADJUSTMENT_REQUESTED',
    'APPROVED_FOR_NEGOTIATION',
    'REJECTED',
    'CONVERTED_TO_OPERATION',
  ],
};

/** Colunas fixas na ordem do kanban. */
export const kanbanColumns: ProposalStatus[] = [
  'SUBMITTED',
  'UNDER_COMMERCIAL_REVIEW',
  'UNDER_OPERATIONAL_REVIEW',
  'DOCUMENTATION_REVIEW_REQUIRED',
  'ADJUSTMENT_REQUESTED',
  'APPROVED_FOR_NEGOTIATION',
  'CONVERTED_TO_OPERATION',
  'REJECTED',
];
