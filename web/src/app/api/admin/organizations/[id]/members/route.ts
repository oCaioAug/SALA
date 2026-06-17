import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { assertCanAddMember } from "@/lib/organization/plan-limits";
import { prisma } from "@/lib/prisma";
import { addMemberSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Erro ao listar membros:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id: organizationId } = await params;
    const body = await request.json();
    const data = addMemberSchema.parse(body);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (data.role === OrganizationRole.OWNER) {
      return NextResponse.json(
        { error: "Use transferência de ownership para definir owner" },
        { status: 400 }
      );
    }

    const memberLimit = await assertCanAddMember(organizationId);
    if (!memberLimit.ok) {
      return apiErrorResponse(memberLimit.errorCode, 403, {
        max: memberLimit.max,
      });
    }

    let user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name ?? data.email.split("@")[0],
        },
      });
    }

    const existing = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Usuário já é membro desta organização" },
        { status: 409 }
      );
    }

    const member = await prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "member.added",
      entityType: "OrganizationMember",
      entityId: member.id,
      organizationId,
      metadata: { email: data.email, role: data.role },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar membro:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id: organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (userId === organization.ownerId) {
      return NextResponse.json(
        { error: "Não é possível remover o owner da organização" },
        { status: 400 }
      );
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      include: { user: { select: { email: true } } },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      );
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "member.removed",
      entityType: "OrganizationMember",
      entityId: member.id,
      organizationId,
      metadata: { email: member.user.email, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover membro:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
