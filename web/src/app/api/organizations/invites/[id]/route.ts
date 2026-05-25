import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    const invite = await prisma.organizationInvite.findFirst({
      where: {
        id,
        organizationId: auth.organizationId!,
        acceptedAt: null,
      },
    });

    if (!invite) {
      return apiErrorResponse(ApiErrorCode.INVITE_NOT_FOUND, 404);
    }

    await prisma.organizationInvite.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "invite.cancelled",
      entityType: "OrganizationInvite",
      entityId: id,
      organizationId: auth.organizationId!,
      metadata: { email: invite.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao cancelar convite:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
