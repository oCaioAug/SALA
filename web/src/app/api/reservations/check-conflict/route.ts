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

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const body = await request.json();
    const { roomId, startTime, endTime, excludeReservationId } = body;

    if (!roomId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    const room = await getRoomInOrganization(roomId, ctx.organizationId);
    if (!room) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        organizationId: ctx.organizationId,
        roomId,
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        status: { in: ["ACTIVE", "APPROVED"] },
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
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      hasConflict: conflictingReservations.length > 0,
      conflictingReservations,
      conflictCount: conflictingReservations.length,
    });
  } catch (error) {
    console.error("Erro ao verificar conflitos:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
