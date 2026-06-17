-- AlterTable: User registration fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_cpf_key" ON "users"("cpf");

-- AlterTable: Organization B2B fields
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "legalName" TEXT;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "cnpj" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "organizations_cnpj_key" ON "organizations"("cnpj");
