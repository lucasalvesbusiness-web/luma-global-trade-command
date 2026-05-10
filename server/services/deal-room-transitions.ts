import type { DealRoomStatus } from '@prisma/client';

/**
 * FSM for DealRoom.
 *
 * Linear happy path:
 *   OPENED → SCOPED → QUOTED → ACCEPTED → IN_PROGRESS → DELIVERED → CONFIRMED → CLOSED
 *
 * Side branches available from most non-terminal states:
 *   * → DISPUTED (only after ACCEPTED, indicates active conflict)
 *   * → CANCELLED (any pre-acceptance state can cancel; post-acceptance requires DISPUTED first)
 *
 * Each transition lists who can fire it. SUPPLIER and BUYER refer to the
 * Company role within the deal room, not platform roles.
 */
export type Actor = 'SUPPLIER' | 'BUYER' | 'EITHER';

export type Transition = {
  from: DealRoomStatus;
  to: DealRoomStatus;
  actor: Actor;
  action: string;
};

export const TRANSITIONS: Transition[] = [
  { from: 'OPENED', to: 'SCOPED', actor: 'EITHER', action: 'SCOPE_DEFINED' },
  { from: 'SCOPED', to: 'QUOTED', actor: 'SUPPLIER', action: 'QUOTE_SUBMITTED' },
  { from: 'QUOTED', to: 'SCOPED', actor: 'BUYER', action: 'QUOTE_REJECTED' },
  { from: 'QUOTED', to: 'ACCEPTED', actor: 'BUYER', action: 'QUOTE_ACCEPTED' },
  { from: 'ACCEPTED', to: 'IN_PROGRESS', actor: 'SUPPLIER', action: 'EXECUTION_STARTED' },
  { from: 'IN_PROGRESS', to: 'DELIVERED', actor: 'SUPPLIER', action: 'DELIVERY_DECLARED' },
  { from: 'DELIVERED', to: 'CONFIRMED', actor: 'BUYER', action: 'DELIVERY_CONFIRMED' },
  { from: 'DELIVERED', to: 'IN_PROGRESS', actor: 'BUYER', action: 'DELIVERY_REJECTED' },
  { from: 'CONFIRMED', to: 'CLOSED', actor: 'EITHER', action: 'DEAL_CLOSED' },
  // Dispute available once execution started.
  { from: 'IN_PROGRESS', to: 'DISPUTED', actor: 'EITHER', action: 'DISPUTE_OPENED' },
  { from: 'DELIVERED', to: 'DISPUTED', actor: 'EITHER', action: 'DISPUTE_OPENED' },
  // Cancel available pre-acceptance.
  { from: 'OPENED', to: 'CANCELLED', actor: 'EITHER', action: 'DEAL_CANCELLED' },
  { from: 'SCOPED', to: 'CANCELLED', actor: 'EITHER', action: 'DEAL_CANCELLED' },
  { from: 'QUOTED', to: 'CANCELLED', actor: 'EITHER', action: 'DEAL_CANCELLED' },
  { from: 'DISPUTED', to: 'CANCELLED', actor: 'EITHER', action: 'DEAL_CANCELLED' },
  { from: 'DISPUTED', to: 'IN_PROGRESS', actor: 'EITHER', action: 'DISPUTE_RESOLVED' },
];

export function findTransition(
  from: DealRoomStatus,
  to: DealRoomStatus,
): Transition | undefined {
  return TRANSITIONS.find((t) => t.from === from && t.to === to);
}

export function canActorPerform(transition: Transition, actor: 'SUPPLIER' | 'BUYER'): boolean {
  return transition.actor === 'EITHER' || transition.actor === actor;
}

export function allowedNextStates(from: DealRoomStatus): DealRoomStatus[] {
  return TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
}
