import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { transferOwnershipSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id: organizationId } = await params;
    const body = await request.json();
    const data = transferOwnershipSchema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization || organization.deletedAt) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (organization.ownerId === data.newOwnerUserId) {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400);
    }

    const newOwnerMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: data.newOwnerUserId,
        },
      },
    });
    if (!newOwnerMember) {
      return apiErrorResponse(ApiErrorCode.MEMBER_NOT_FOUND, 404);
    }

    const previousOwnerId = organization.ownerId;

    await prisma.$transaction(async tx => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { ownerId: data.newOwnerUserId },
      });

      await tx.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId: previousOwnerId,
          },
        },
        data: { role: OrganizationRole.ADMIN },
      });

      await tx.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId: data.newOwnerUserId,
          },
        },
        data: { role: OrganizationRole.OWNER },
      });
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "organization.ownership_transferred",
      entityType: "Organization",
      entityId: organizationId,
      organizationId,
      metadata: {
        previousOwnerId,
        newOwnerUserId: data.newOwnerUserId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return apiErrorResponse(ApiErrorCode.INVALID_DATA, 400);
    }
    console.error("Erro ao transferir ownership:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
