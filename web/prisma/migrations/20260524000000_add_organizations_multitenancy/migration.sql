-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'NONE');
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL');

-- AlterTable: add platformRole to users
ALTER TABLE "users" ADD COLUMN "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE';

-- CreateTable: organizations (ownerId nullable initially for bootstrap)
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "logo" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: organization_members
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add organizationId to rooms (nullable for migration)
ALTER TABLE "rooms" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");
CREATE INDEX "rooms_organizationId_idx" ON "rooms"("organizationId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: default organization
DO $$
DECLARE
  default_org_id TEXT := 'org-sala-default';
  admin_user_id TEXT;
  any_user_id TEXT;
BEGIN
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@sala.com' LIMIT 1;
  IF admin_user_id IS NULL THEN
    SELECT id INTO any_user_id FROM users ORDER BY "createdAt" ASC LIMIT 1;
    admin_user_id := any_user_id;
  END IF;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO organizations (id, name, slug, status, "ownerId", "createdAt", "updatedAt")
    VALUES (default_org_id, 'SALA Default', 'sala-default', 'ACTIVE', admin_user_id, NOW(), NOW())
    ON CONFLICT DO NOTHING;

    UPDATE rooms SET "organizationId" = default_org_id WHERE "organizationId" IS NULL;

    INSERT INTO organization_members (id, "organizationId", "userId", role, "createdAt", "updatedAt")
    SELECT
      'om-' || u.id,
      default_org_id,
      u.id,
      CASE
        WHEN u.role = 'ADMIN' THEN 'ADMIN'::"OrganizationRole"
        ELSE 'MEMBER'::"OrganizationRole"
      END,
      NOW(),
      NOW()
    FROM users u
  WHERE u."platformRole" = 'NONE'
    ON CONFLICT ("organizationId", "userId") DO NOTHING;

    UPDATE organization_members
    SET role = 'OWNER'::"OrganizationRole"
    WHERE "organizationId" = default_org_id AND "userId" = admin_user_id;

    UPDATE users SET "platformRole" = 'SUPER_ADMIN'::"PlatformRole" WHERE email = 'admin@sala.com';
  END IF;
END $$;

-- Make organizationId NOT NULL on rooms (only if all rooms have org)
ALTER TABLE "rooms" ALTER COLUMN "organizationId" SET NOT NULL;
