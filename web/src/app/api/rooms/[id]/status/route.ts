import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getRoomInOrganization } from "@/lib/auth/tenant-queries";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id: roomId } = await params;
    const room = await getRoomInOrganization(roomId, ctx.organizationId);
    if (!room) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    const now = new Date();

    const currentReservation = await prisma.reservation.findFirst({
      where: {
        organizationId: ctx.organizationId,
        roomId,
        status: "ACTIVE",
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: { user: true },
    });

    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        organizationId: ctx.organizationId,
        roomId,
        status: "ACTIVE",
        startTime: { gt: now },
      },
      include: { user: true },
      orderBy: { startTime: "asc" },
      take: 5,
    });

    return NextResponse.json({
      isCurrentlyOccupied: !!currentReservation,
      currentReservation,
      upcomingReservations,
      canMakeReservation: true,
    });
  } catch (error) {
    console.error("Erro ao verificar status da sala:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
