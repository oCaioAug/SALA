import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { getReservationInOrganization } from "@/lib/auth/tenant-queries";
import { syncReservationToGoogleCalendar } from "@/lib/googleCalendar";
import { notificationService } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id: reservationId } = await params;
    if (!reservationId) {
      return NextResponse.json(
        { error: "ID da reserva não fornecido" },
        { status: 400 }
      );
    }

    const reservation = await getReservationInOrganization(
      reservationId,
      auth.organizationId
    );

    if (!reservation) {
      return apiErrorResponse(ApiErrorCode.RESERVATION_NOT_FOUND, 404);
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta reserva já foi processada" },
        { status: 400 }
      );
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: "REJECTED", updatedAt: new Date() },
      include: { user: true, room: true },
    });

    try {
      await notificationService.reservationRejected(updatedReservation);
    } catch (notificationError) {
      console.error(
        "Erro ao criar notificação de rejeição:",
        notificationError
      );
    }

    void syncReservationToGoogleCalendar(updatedReservation.id);

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Erro ao rejeitar reserva:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
