import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isInviteActive } from "@/lib/organization/invites";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, status: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!invite) {
      return apiErrorResponse(ApiErrorCode.INVITE_NOT_FOUND, 404);
    }

    if (!isInviteActive(invite)) {
      return apiErrorResponse(ApiErrorCode.INVITE_EXPIRED, 410);
    }

    return NextResponse.json({
      token: invite.token,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      organization: invite.organization,
      invitedBy: invite.invitedBy,
    });
  } catch (error) {
    console.error("Erro ao buscar convite:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
