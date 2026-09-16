-- Purge soft-deleted sectors before switching to hard delete.
-- Rooms were already unlinked on soft-delete; members cascade with sector.
DELETE FROM "sectors" WHERE "deletedAt" IS NOT NULL;

DROP INDEX IF EXISTS "sectors_organizationId_name_active_key";
DROP INDEX IF EXISTS "sectors_deletedAt_idx";

ALTER TABLE "sectors" DROP COLUMN IF EXISTS "deletedAt";

CREATE UNIQUE INDEX "sectors_organizationId_name_key"
ON "sectors"("organizationId", "name");
