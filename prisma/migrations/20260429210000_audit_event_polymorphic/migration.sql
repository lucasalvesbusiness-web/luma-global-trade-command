-- Polymorphic audit log: split the FK column from the polymorphic id.
-- Before: entityId had a hard FK to proposals(id), so non-proposal events could not be inserted.
-- After: entityId is a plain UUID (no FK); proposalId carries the FK only when entity = 'Proposal'.

-- 1. Add the new FK column.
ALTER TABLE "audit_events" ADD COLUMN "proposalId" UUID;

-- 2. Backfill from existing rows where the entity is a proposal.
UPDATE "audit_events"
SET "proposalId" = "entityId"
WHERE "entity" = 'Proposal';

-- 3. Drop the old FK that bound entityId to proposals.
ALTER TABLE "audit_events" DROP CONSTRAINT "audit_events_proposal_fk";

-- 4. Re-create the FK on the new column.
ALTER TABLE "audit_events"
  ADD CONSTRAINT "audit_events_proposal_fk"
  FOREIGN KEY ("proposalId") REFERENCES "proposals"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Index on the new FK column for back-relation lookups.
CREATE INDEX "audit_events_proposalId_idx" ON "audit_events"("proposalId");
