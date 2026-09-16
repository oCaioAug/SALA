-- Allow reusing sector names after soft-delete (active rows only).
DROP INDEX IF EXISTS "sectors_organizationId_name_key";

CREATE UNIQUE INDEX "sectors_organizationId_name_active_key"
ON "sectors"("organizationId", "name")
WHERE "deletedAt" IS NULL;
