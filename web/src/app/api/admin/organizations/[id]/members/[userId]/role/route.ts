import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { updateMemberRoleSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id, userId } = await params;
    const body = await request.json();
    const data = updateMemberRoleSchema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id },
    });
    if (!organization) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (
      userId === organization.ownerId &&
      data.role !== OrganizationRole.OWNER
    ) {
      return NextResponse.json(
        { error: "Não é possível alterar o papel do owner desta forma" },
        { status: 400 }
      );
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
      data: { role: data.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "member.role_changed",
      entityType: "OrganizationMember",
      entityId: updated.id,
      organizationId: id,
      metadata: {
        userId,
        from: member.role,
        to: data.role,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar papel do membro:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
