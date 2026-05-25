import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { notificationService } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { pushNotificationService } from "@/lib/push-notification-service";
import { locales, type Locale } from "@/config";

function resolveLocaleFromRequest(req: NextRequest): Locale {
  const header =
    req.headers.get("x-next-intl-locale") ??
    req.headers.get("accept-language")?.split(",")[0]?.trim().slice(0, 2);
  if (header && (locales as readonly string[]).includes(header)) {
    return header as Locale;
  }
  return "pt";
}

const approveReservationSchema = z.object({
  reservationId: z.string().min(1, "ID da reserva é obrigatório"),
  approved: z.boolean(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return apiErrorResponse(ApiErrorCode.NOT_AUTHENTICATED, 401);
    }

    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const locale = resolveLocaleFromRequest(req);
    const body = await req.json();
    const { reservationId, approved, reason } =
      approveReservationSchema.parse(body);

    const reservation = await prisma.reservation.findFirst({
      where: { id: reservationId, organizationId: auth.organizationId },
      include: { room: true, user: true },
    });

    if (!reservation) {
      return apiErrorResponse(ApiErrorCode.RESERVATION_NOT_FOUND, 404);
    }

    if (reservation.status !== "PENDING") {
      return apiErrorResponse(ApiErrorCode.RESERVATION_NOT_PENDING, 400);
    }

    // Atualizar status da reserva
    const newStatus = approved ? "APPROVED" : "REJECTED";

    // Se for uma reserva recorrente, atualizar todas as instâncias
    if (reservation.isRecurring && reservation.recurringTemplateId) {
      // Buscar todas as reservas com o mesmo recurringTemplateId
      const allRecurringReservations = await prisma.reservation.findMany({
        where: {
          organizationId: auth.organizationId,
          recurringTemplateId: reservation.recurringTemplateId,
          status: "PENDING",
        },
        include: {
          room: true,
          user: true,
        },
      });

      // Atualizar todas as reservas recorrentes
      await prisma.reservation.updateMany({
        where: {
          recurringTemplateId: reservation.recurringTemplateId,
          status: "PENDING",
        },
        data: {
          status: newStatus,
        },
      });

      // Buscar a reserva atualizada para retornar
      const updatedReservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          room: true,
          user: true,
        },
      });

      if (!updatedReservation) {
        return apiErrorResponse(ApiErrorCode.RESERVATION_NOT_FOUND, 404);
      }

      if (approved) {
        await notificationService.reservationApproved(
          updatedReservation,
          locale
        );
      } else {
        await notificationService.reservationRejected(
          updatedReservation,
          reason,
          locale
        );
      }

      // Enviar notificação push (uma para todas as instâncias)
      try {
        if (approved) {
          await pushNotificationService.sendReservationApprovalNotification(
            reservation.userId,
            {
              roomName: reservation.room.name,
              startTime: reservation.startTime,
              endTime: reservation.endTime,
            },
            locale
          );
        } else {
          await pushNotificationService.sendReservationRejectionNotification(
            reservation.userId,
            {
              roomName: reservation.room.name,
              startTime: reservation.startTime,
              reason: reason,
            },
            locale
          );
        }
      } catch (pushError) {
        console.error("[approve] Erro ao enviar notificação push:", pushError);
      }

      return NextResponse.json({
        id: updatedReservation.id,
        status: updatedReservation.status,
        message: approved
          ? `Reserva recorrente aprovada! ${allRecurringReservations.length} instâncias foram aprovadas.`
          : `Reserva recorrente rejeitada! ${allRecurringReservations.length} instâncias foram rejeitadas.`,
        notification_sent: true,
        recurringInstances: allRecurringReservations.length,
      });
    }

    // Reserva única (não recorrente)
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: newStatus },
      include: {
        room: true,
        user: true,
      },
    });

    if (approved) {
      await notificationService.reservationApproved(updatedReservation, locale);
    } else {
      await notificationService.reservationRejected(
        updatedReservation,
        reason,
        locale
      );
    }

    try {
      if (approved) {
        await pushNotificationService.sendReservationApprovalNotification(
          reservation.userId,
          {
            roomName: reservation.room.name,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
          },
          locale
        );
      } else {
        await pushNotificationService.sendReservationRejectionNotification(
          reservation.userId,
          {
            roomName: reservation.room.name,
            startTime: reservation.startTime,
            reason: reason,
          },
          locale
        );
      }
    } catch (pushError) {
      console.error("[approve] Erro ao enviar notificação push:", pushError);
    }

    return NextResponse.json({
      id: updatedReservation.id,
      status: updatedReservation.status,
      message: approved
        ? "Reserva aprovada com sucesso!"
        : "Reserva rejeitada com sucesso!",
      notification_sent: true,
    });
  } catch (error) {
    console.error("Erro ao processar aprovação de reserva:", error);

    if (error instanceof z.ZodError) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400, {
        details: error.issues,
      });
    }

    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
