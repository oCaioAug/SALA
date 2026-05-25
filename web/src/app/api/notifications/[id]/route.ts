import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;

    const existing = await prisma.notification.findFirst({
      where: {
        id,
        userId: ctx.user.id,
        OR: [{ organizationId: ctx.organizationId }, { organizationId: null }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: { user: true },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return NextResponse.json(
      {
        errorCode: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;

    const existing = await prisma.notification.findFirst({
      where: {
        id,
        userId: ctx.user.id,
        OR: [{ organizationId: ctx.organizationId }, { organizationId: null }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar notificação:", error);
    return NextResponse.json(
      {
        errorCode: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
