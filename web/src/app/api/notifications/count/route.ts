import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    let actualUserId = userId;
    if (userId.includes("@")) {
      const user = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true },
      });
      if (!user) {
        return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
      }
      actualUserId = user.id;
    }

    if (
      actualUserId !== ctx.user.id &&
      !isOrgAdmin({
        platformRole: ctx.user.platformRole,
        organizationRole: ctx.user.organizationRole,
      })
    ) {
      return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
    }

    const count = await prisma.notification.count({
      where: {
        userId: actualUserId,
        isRead: false,
        OR: [{ organizationId: ctx.organizationId }, { organizationId: null }],
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Erro ao contar notificações:", error);

    if (
      error instanceof Error &&
      (error.message.includes("timeout") ||
        error.message.includes("connection pool") ||
        error.message.includes("P2024"))
    ) {
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json(
      {
        errorCode: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
