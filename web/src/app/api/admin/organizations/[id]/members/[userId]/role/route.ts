import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

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

    if (data.role === OrganizationRole.OWNER) {
      return apiErrorResponse(ApiErrorCode.OWNER_TRANSFER_REQUIRED, 400);
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });
    if (!organization || organization.deletedAt) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (userId === organization.ownerId) {
      return apiErrorResponse(ApiErrorCode.CANNOT_CHANGE_OWNER_ROLE, 400);
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
      return apiErrorResponse(ApiErrorCode.MEMBER_NOT_FOUND, 404);
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
    if (error instanceof ZodError) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400);
    }
    console.error("Erro ao atualizar papel do membro:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
