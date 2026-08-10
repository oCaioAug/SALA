-- CreateEnum
CREATE TYPE "SectorMemberRole" AS ENUM ('MANAGER');

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_members" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SectorMemberRole" NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_members_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN "sectorId" TEXT;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "decidedById" TEXT,
ADD COLUMN "decidedAt" TIMESTAMP(3),
ADD COLUMN "decisionReason" TEXT;

-- CreateIndex
CREATE INDEX "sectors_organizationId_idx" ON "sectors"("organizationId");

-- CreateIndex
CREATE INDEX "sectors_deletedAt_idx" ON "sectors"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sectors_organizationId_name_key" ON "sectors"("organizationId", "name");

-- CreateIndex
CREATE INDEX "sector_members_userId_idx" ON "sector_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sector_members_sectorId_userId_key" ON "sector_members"("sectorId", "userId");

-- CreateIndex
CREATE INDEX "rooms_sectorId_idx" ON "rooms"("sectorId");

-- CreateIndex
CREATE INDEX "reservations_decidedById_idx" ON "reservations"("decidedById");

-- AddForeignKey
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sector_members" ADD CONSTRAINT "sector_members_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sector_members" ADD CONSTRAINT "sector_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
