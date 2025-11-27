-- CreateEnum
-- Adiciona o enum RecurringPattern se não existir
DO $$ BEGIN
    CREATE TYPE "public"."RecurringPattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
-- Adiciona os campos de recorrência à tabela reservations
-- Todos os campos têm valores padrão, então não afeta dados existentes

ALTER TABLE "public"."reservations" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."reservations" ADD COLUMN IF NOT EXISTS "recurringPattern" "public"."RecurringPattern";
ALTER TABLE "public"."reservations" ADD COLUMN IF NOT EXISTS "recurringDaysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "public"."reservations" ADD COLUMN IF NOT EXISTS "recurringEndDate" TIMESTAMP(3);
ALTER TABLE "public"."reservations" ADD COLUMN IF NOT EXISTS "parentReservationId" TEXT;
ALTER TABLE "public"."reservations" ADD COLUMN IF NOT EXISTS "recurringTemplateId" TEXT;

-- AddForeignKey
-- Adiciona a foreign key para o relacionamento de reservas recorrentes
DO $$ BEGIN
    ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_parentReservationId_fkey" FOREIGN KEY ("parentReservationId") REFERENCES "public"."reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;



