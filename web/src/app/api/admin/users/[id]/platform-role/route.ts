import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { PlatformRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { updatePlatformRoleSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = updatePlatformRoleSchema.parse(body);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    if (id === auth.id && data.platformRole !== PlatformRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Você não pode remover seu próprio acesso de super admin" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { platformRole: data.platformRole },
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
        createdAt: true,
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "user.platform_role_changed",
      entityType: "User",
      entityId: id,
      metadata: {
        email: target.email,
        from: target.platformRole,
        to: data.platformRole,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar platform role:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
