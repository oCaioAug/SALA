import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    if (id === auth.id) {
      return apiErrorResponse(ApiErrorCode.CANNOT_DELETE_SELF, 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }
    if (target.deletedAt) {
      return apiErrorResponse(ApiErrorCode.USER_ALREADY_DELETED, 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
        deletedAt: true,
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "user.soft_deleted",
      entityType: "User",
      entityId: id,
      metadata: { email: target.email },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
