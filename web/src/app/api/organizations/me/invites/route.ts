import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";

import { isNextResponse, requireAuth } from "@/lib/auth/platform";
import { isInviteActive } from "@/lib/organization/invites";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const invites = await prisma.organizationInvite.findMany({
      where: {
        email: { equals: auth.email, mode: "insensitive" },
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      invites.map(invite => ({
        id: invite.id,
        token: invite.token,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        organization: invite.organization,
        invitedBy: invite.invitedBy,
        isActive: isInviteActive(invite),
      }))
    );
  } catch (error) {
    console.error("Erro ao listar convites pendentes:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
