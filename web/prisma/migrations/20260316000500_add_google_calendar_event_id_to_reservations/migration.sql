-- AlterTable
ALTER TABLE "public"."reservations"
ADD COLUMN IF NOT EXISTS "googleCalendarEventId" TEXT;

