/**
 * Aplica uma transição de status na proposta + envia notificação ao comprador.
 *
 * Centraliza o efeito colateral de e-mail para que tanto o staff transition
 * (internal.transitionStatus) quanto o buyer resubmit (proposal.resubmit)
 * compartilhem a mesma garantia: a transição DB nunca falha por causa de mail.
 */

import { repositories } from '@/server/repositories';
import type {
  ProposalNoteKind,
  ProposalStatus,
  StaffTeam,
} from '@/server/repositories/types';
import { db } from '@/lib/db';
import { sendProposalStatusChanged } from '@/server/mail/proposal-status-changed';

export type ApplyTransitionInput = {
  proposalId: string;
  fromStatus: ProposalStatus;
  toStatus: ProposalStatus;
  actorUserId: string;
  actorTeam: StaffTeam | null;
  note?: { body: string; kind: ProposalNoteKind } | null;
};

export async function applyProposalTransition(
  input: ApplyTransitionInput,
): Promise<void> {
  await repositories.proposal.updateStatus(input);

  // Best-effort buyer notification. Falhas de mail nunca quebram a transição.
  try {
    const proposal = await db.proposal.findUnique({
      where: { id: input.proposalId },
      select: {
        reference: true,
        createdBy: { select: { email: true, name: true } },
      },
    });
    const email = proposal?.createdBy?.email;
    const name = proposal?.createdBy?.name ?? proposal?.createdBy?.email ?? null;
    if (proposal && email && name) {
      const baseUrl =
        process.env.AUTH_URL ??
        process.env.NEXTAUTH_URL ??
        'http://localhost:3000';
      const buyerNoteBody =
        input.note?.kind === 'TO_BUYER' ? input.note.body : null;
      await sendProposalStatusChanged({
        to: email,
        buyerContactName: name,
        reference: proposal.reference,
        toStatus: input.toStatus,
        buyerNoteBody,
        baseUrl,
      });
    }
  } catch (err) {
    console.warn('[proposal-transitions] buyer mail failed', err);
  }
}
