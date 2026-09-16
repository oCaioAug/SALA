import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { canApproveReservation } from "@/lib/auth/permissions";
import {
  isNextResponse,
  requireReservationApprover,
} from "@/lib/auth/platform";
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
    const auth = await requireReservationApprover();
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

    const allowed = await canApproveReservation(
      {
        id: auth.id,
        organizationId: auth.organizationId,
        organizationRole: auth.organizationRole,
      },
      reservation
    );
    if (!allowed) {
      return apiErrorResponse(ApiErrorCode.FORBIDDEN, 403);
    }

    const newStatus = approved ? "APPROVED" : "REJECTED";
    const decisionData = {
      status: newStatus as "APPROVED" | "REJECTED",
      decidedById: auth.id,
      decidedAt: new Date(),
      decisionReason: reason ?? null,
    };

    if (reservation.isRecurring && reservation.recurringTemplateId) {
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

      for (const instance of allRecurringReservations) {
        const canApproveInstance = await canApproveReservation(
          {
            id: auth.id,
            organizationId: auth.organizationId,
            organizationRole: auth.organizationRole,
          },
          instance
        );
        if (!canApproveInstance) {
          return apiErrorResponse(ApiErrorCode.FORBIDDEN, 403);
        }
      }

      await prisma.reservation.updateMany({
        where: {
          recurringTemplateId: reservation.recurringTemplateId,
          status: "PENDING",
        },
        data: decisionData,
      });

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

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: decisionData,
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
