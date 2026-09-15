import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }
    if (!existing.deletedAt) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_DELETED, 400);
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: { deletedAt: null },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "organization.restored",
      entityType: "Organization",
      entityId: id,
      organizationId: id,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Erro ao restaurar organização:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
