-- Relax CompanyMember roles: remove BUYER (every company is contextually
-- buyer/supplier per deal). Migrate existing BUYER members to OPERATIONS.
UPDATE "CompanyMember" SET "role" = 'OPERATIONS' WHERE "role" = 'BUYER';
