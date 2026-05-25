import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getOrgMemberUserIds } from "@/lib/auth/tenant-queries";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ userId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { userId } = await params;
    const memberIds = await getOrgMemberUserIds(ctx.organizationId);
    if (!memberIds.includes(userId)) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId, organizationId: ctx.organizationId },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const stats = {
      total: reservations.length,
      completed: reservations.filter(r => {
        const endTime = new Date(r.endTime);
        return endTime < now && r.status === "APPROVED";
      }).length,
      active: reservations.filter(r => {
        const startTime = new Date(r.startTime);
        const endTime = new Date(r.endTime);
        return startTime <= now && endTime >= now && r.status === "APPROVED";
      }).length,
      pending: reservations.filter(r => r.status === "PENDING").length,
      rejected: reservations.filter(r => r.status === "REJECTED").length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas de reservas:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
