import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;
    const days = 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    since.setUTCHours(0, 0, 0, 0);

    const stats = await prisma.organizationDailyStats.findMany({
      where: {
        organizationId: id,
        date: { gte: since },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao buscar stats da org:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
