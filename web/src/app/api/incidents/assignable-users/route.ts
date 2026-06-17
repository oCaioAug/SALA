import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdmin, toLegacySessionRole } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;

    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    if (
      !isOrgAdmin({
        platformRole: ctx.user.platformRole,
        organizationRole: ctx.user.organizationRole,
      })
    ) {
      return NextResponse.json(
        { error: "Apenas administradores podem listar usuários" },
        { status: 403 }
      );
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: ctx.organizationId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: {
                assignedIncidents: {
                  where: {
                    organizationId: ctx.organizationId,
                    status: {
                      in: ["REPORTED", "IN_ANALYSIS", "IN_PROGRESS"],
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
    });

    const usersWithStats = members.map(({ role, user }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      organizationRole: role,
      role: toLegacySessionRole({ organizationRole: role }),
      activeIncidents: user._count.assignedIncidents,
    }));

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Erro ao buscar usuários assignáveis:", error);
    return NextResponse.json(
      {
        errorCode: ApiErrorCode.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
