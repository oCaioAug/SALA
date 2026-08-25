-- AlterTable
ALTER TABLE "sector_members" ADD COLUMN "canApproveReservations" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "sector_members" ADD COLUMN "canManageRooms" BOOLEAN NOT NULL DEFAULT true;
