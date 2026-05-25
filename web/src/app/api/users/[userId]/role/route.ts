import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import {
  getAuthUser,
  isNextResponse,
  requireOrgAdmin,
} from "@/lib/auth/platform";
import {
  isOrgAdmin,
  legacyRoleToOrganizationRole,
  toLegacySessionRole,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { role } = await request.json();

    if (!role || !["ADMIN", "USER"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválido. Use 'ADMIN' ou 'USER'." },
        { status: 400 }
      );
    }

    if (userId === auth.id) {
      return NextResponse.json(
        { error: "Você não pode alterar sua própria permissão" },
        { status: 400 }
      );
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: auth.organizationId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Usuário não encontrado nesta organização" },
        { status: 404 }
      );
    }

    if (member.role === OrganizationRole.OWNER) {
      return NextResponse.json(
        { error: "Não é possível alterar o papel do owner" },
        { status: 400 }
      );
    }

    const newOrgRole = legacyRoleToOrganizationRole(role);

    const updated = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: auth.organizationId,
          userId,
        },
      },
      data: { role: newOrgRole },
    });

    return NextResponse.json({
      ...member.user,
      organizationRole: updated.role,
      role: toLegacySessionRole({ organizationRole: updated.role }),
    });
  } catch (error) {
    console.error("Erro ao alterar role do usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
