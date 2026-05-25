import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import {
  buildInviteUrl,
  getInviteExpiryDate,
  isInviteActive,
} from "@/lib/organization/invites";
import { assertCanAddMember } from "@/lib/organization/plan-limits";
import { prisma } from "@/lib/prisma";
import { createOrganizationInviteSchema } from "@/lib/validations/organization";

export async function GET() {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;

    const invites = await prisma.organizationInvite.findMany({
      where: {
        organizationId: auth.organizationId!,
        acceptedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      invites.map(invite => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        invitedBy: invite.invitedBy,
        isActive: isInviteActive(invite),
        inviteUrl: buildInviteUrl(invite.token),
      }))
    );
  } catch (error) {
    console.error("Erro ao listar convites da org:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;

    const organizationId = auth.organizationId!;
    const body = await request.json();
    const data = createOrganizationInviteSchema.parse(body);

    const memberLimit = await assertCanAddMember(organizationId);
    if (!memberLimit.ok) {
      return apiErrorResponse(memberLimit.errorCode, 403, {
        max: memberLimit.max,
      });
    }

    const existingMember = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        memberships: {
          where: { organizationId },
          take: 1,
        },
      },
    });

    if (existingMember?.memberships.length) {
      return apiErrorResponse(ApiErrorCode.INVITE_ALREADY_MEMBER, 409);
    }

    const pendingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId,
        email: { equals: data.email, mode: "insensitive" },
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      return NextResponse.json(
        {
          error: "Já existe um convite pendente para este email",
          inviteUrl: buildInviteUrl(pendingInvite.token),
        },
        { status: 409 }
      );
    }

    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId,
        email: data.email.toLowerCase(),
        role: data.role,
        expiresAt: getInviteExpiryDate(),
        invitedById: auth.id,
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "invite.created",
      entityType: "OrganizationInvite",
      entityId: invite.id,
      organizationId,
      metadata: { email: data.email, role: data.role },
    });

    return NextResponse.json(
      {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        inviteUrl: buildInviteUrl(invite.token),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar convite:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
