import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireAuth } from "@/lib/auth/platform";
import { isInviteActive } from "@/lib/organization/invites";
import { assertCanAddMember } from "@/lib/organization/plan-limits";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const { token } = await params;

    const invite = await prisma.organizationInvite.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true, deletedAt: true },
        },
      },
    });

    if (!invite || invite.organization.deletedAt) {
      return apiErrorResponse(ApiErrorCode.INVITE_NOT_FOUND, 404);
    }

    if (!isInviteActive(invite)) {
      return apiErrorResponse(ApiErrorCode.INVITE_EXPIRED, 410);
    }

    if (auth.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          error:
            "Este convite foi enviado para outro email. Faça login com a conta correta.",
        },
        { status: 403 }
      );
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId: auth.id,
        },
      },
      select: { id: true },
    });
    if (existingMember) {
      return apiErrorResponse(ApiErrorCode.INVITE_ALREADY_MEMBER, 409);
    }

    const memberLimit = await assertCanAddMember(invite.organizationId);
    if (!memberLimit.ok) {
      return apiErrorResponse(memberLimit.errorCode, 403, {
        max: memberLimit.max,
      });
    }

    const member = await prisma.$transaction(async tx => {
      const created = await tx.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId: auth.id,
          role: invite.role,
          invitedById: invite.invitedById,
        },
      });

      await tx.organizationInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return created;
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "invite.accepted",
      entityType: "OrganizationInvite",
      entityId: invite.id,
      organizationId: invite.organizationId,
      metadata: { email: invite.email, role: invite.role },
    });

    return NextResponse.json({
      success: true,
      organizationId: invite.organizationId,
      organizationName: invite.organization.name,
      memberId: member.id,
      role: member.role,
    });
  } catch (error) {
    console.error("Erro ao aceitar convite:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
