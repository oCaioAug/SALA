import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

function notificationOrgFilter(organizationId: string) {
  return {
    OR: [{ organizationId }, { organizationId: null }],
  };
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const isRead = searchParams.get("isRead");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    let user;
    if (userId.includes("@")) {
      user = await prisma.user.findUnique({ where: { email: userId } });
    } else {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    if (
      user.id !== ctx.user.id &&
      !isOrgAdmin({
        platformRole: ctx.user.platformRole,
        organizationRole: ctx.user.organizationRole,
      })
    ) {
      return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
    }

    const where: Record<string, unknown> = {
      userId: user.id,
      ...notificationOrgFilter(ctx.organizationId),
    };

    if (isRead !== null) {
      where.isRead = isRead === "true";
    }

    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json(
      {
        errorCode: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title e message são obrigatórios" },
        { status: 400 }
      );
    }

    const validTypes = [
      "RESERVATION_CREATED",
      "RESERVATION_APPROVED",
      "RESERVATION_REJECTED",
      "RESERVATION_CANCELLED",
      "RESERVATION_CONFLICT",
      "RESERVATION_REMINDER",
      "ROOM_STATUS_CHANGED",
      "SYSTEM_ANNOUNCEMENT",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de notificação inválido" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        organizationId: ctx.organizationId,
        type,
        title,
        message,
        data: data || null,
      },
      include: { user: true },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    return NextResponse.json(
      {
        errorCode: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
