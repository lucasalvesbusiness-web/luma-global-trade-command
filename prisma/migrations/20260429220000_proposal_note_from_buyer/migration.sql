-- Allow buyer-authored notes (e.g. when resubmitting after ADJUSTMENT_REQUESTED).
ALTER TYPE "ProposalNoteKind" ADD VALUE 'FROM_BUYER';
