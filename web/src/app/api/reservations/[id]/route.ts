import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { canApproveReservation } from "@/lib/auth/permissions";
import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getReservationInOrganization } from "@/lib/auth/tenant-queries";
import { syncReservationToGoogleCalendar } from "@/lib/googleCalendar";
import { notificationService } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

async function requireReservationInTenant(id: string) {
  const ctx = await requireTenantContext();
  if (isNextResponse(ctx)) return ctx;
  if (ctx.isSuperAdmin || !ctx.organizationId) {
    return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
  }

  const reservation = await getReservationInOrganization(
    id,
    ctx.organizationId
  );
  if (!reservation) {
    return apiErrorResponse(ApiErrorCode.RESERVATION_NOT_FOUND, 404);
  }

  return { ctx, reservation };
}

async function canModifyReservation(
  user: {
    id: string;
    organizationId: string | null;
    organizationRole: Parameters<typeof isOrgAdmin>[0]["organizationRole"];
  },
  reservation: {
    userId: string;
    organizationId: string;
    room: {
      id: string;
      organizationId: string;
      sectorId: string | null;
    };
  }
): Promise<boolean> {
  if (reservation.userId === user.id) return true;

  if (
    isOrgAdmin({
      organizationRole: user.organizationRole,
    })
  ) {
    return true;
  }

  return canApproveReservation(
    {
      id: user.id,
      organizationId: user.organizationId,
      organizationRole: user.organizationRole ?? null,
    },
    reservation
  );
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireReservationInTenant(id);
    if (access instanceof NextResponse) return access;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: true,
        room: { include: { sector: { select: { id: true, name: true } } } },
        decidedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Erro ao buscar reserva:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireReservationInTenant(id);
    if (access instanceof NextResponse) return access;

    const { ctx, reservation: existingReservation } = access;

    const allowed = await canModifyReservation(ctx.user, existingReservation);
    if (!allowed) {
      return apiErrorResponse(ApiErrorCode.FORBIDDEN, 403);
    }

    const body = await request.json();
    const { startTime, endTime, purpose, status } = body;

    if (startTime && endTime) {
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: existingReservation.roomId,
          organizationId: existingReservation.organizationId,
          status: "ACTIVE",
          OR: [
            {
              AND: [
                { startTime: { lte: new Date(startTime) } },
                { endTime: { gt: new Date(startTime) } },
              ],
            },
            {
              AND: [
                { startTime: { lt: new Date(endTime) } },
                { endTime: { gte: new Date(endTime) } },
              ],
            },
          ],
        },
      });

      if (conflictingReservation) {
        return NextResponse.json(
          { error: "A sala já está reservada neste horário" },
          { status: 409 }
        );
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(purpose !== undefined && { purpose }),
        ...(status && { status }),
      },
      include: {
        user: true,
        room: true,
        decidedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (status === "CANCELLED") {
      await prisma.room.update({
        where: { id: existingReservation.roomId },
        data: { status: "LIVRE" },
      });
    }

    void syncReservationToGoogleCalendar(updatedReservation.id);

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Erro ao atualizar reserva:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const access = await requireReservationInTenant(id);
    if (access instanceof NextResponse) return access;

    const { ctx, reservation: existingReservation } = access;

    const allowed = await canModifyReservation(ctx.user, existingReservation);
    if (!allowed) {
      return apiErrorResponse(ApiErrorCode.FORBIDDEN, 403);
    }

    const fullReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { user: true, room: true },
    });

    if (!fullReservation) {
      return apiErrorResponse(ApiErrorCode.RESERVATION_NOT_FOUND, 404);
    }

    await prisma.room.update({
      where: { id: existingReservation.roomId },
      data: { status: "LIVRE" },
    });

    const cancelledReservation = await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { user: true, room: true },
    });

    try {
      await notificationService.reservationCancelled(cancelledReservation);
    } catch (notificationError) {
      console.error(
        "Erro ao criar notificação de cancelamento:",
        notificationError
      );
    }

    await syncReservationToGoogleCalendar(id);

    await prisma.reservation.delete({ where: { id } });

    return NextResponse.json({ message: "Reserva cancelada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar reserva:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
