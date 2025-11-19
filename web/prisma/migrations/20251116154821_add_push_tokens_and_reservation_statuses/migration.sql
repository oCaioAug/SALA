-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('RESERVATION_CREATED', 'RESERVATION_APPROVED', 'RESERVATION_REJECTED', 'RESERVATION_CANCELLED', 'RESERVATION_CONFLICT', 'ROOM_STATUS_CHANGED', 'SYSTEM_ANNOUNCEMENT', 'INCIDENT_CREATED', 'INCIDENT_ASSIGNED', 'INCIDENT_STATUS_CHANGED', 'INCIDENT_RESOLVED');

-- CreateEnum
CREATE TYPE "public"."IncidentStatus" AS ENUM ('REPORTED', 'IN_ANALYSIS', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."IncidentPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."IncidentCategory" AS ENUM ('EQUIPMENT_FAILURE', 'INFRASTRUCTURE', 'SOFTWARE', 'SAFETY', 'MAINTENANCE', 'ELECTRICAL', 'NETWORK', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ReservationStatus" ADD VALUE 'PENDING';
ALTER TYPE "public"."ReservationStatus" ADD VALUE 'APPROVED';
ALTER TYPE "public"."ReservationStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "public"."reservations" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."images" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "public"."IncidentPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."IncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "category" "public"."IncidentCategory" NOT NULL,
    "reportedById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "roomId" TEXT,
    "itemId" TEXT,
    "estimatedResolutionTime" TIMESTAMP(3),
    "actualResolutionTime" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."incident_status_history" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "fromStatus" "public"."IncidentStatus",
    "toStatus" "public"."IncidentStatus" NOT NULL,
    "notes" TEXT,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "public"."push_tokens"("token");

-- AddForeignKey
ALTER TABLE "public"."images" ADD CONSTRAINT "images_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incidents" ADD CONSTRAINT "incidents_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incidents" ADD CONSTRAINT "incidents_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incidents" ADD CONSTRAINT "incidents_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incidents" ADD CONSTRAINT "incidents_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incident_status_history" ADD CONSTRAINT "incident_status_history_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incident_status_history" ADD CONSTRAINT "incident_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
