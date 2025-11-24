-- AlterEnum
-- Adiciona o novo tipo RESERVATION_REMINDER ao enum NotificationType
-- Esta operação é segura e não apaga dados existentes

ALTER TYPE "public"."NotificationType" ADD VALUE 'RESERVATION_REMINDER';

