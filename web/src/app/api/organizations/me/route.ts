import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextResponse } from "next/server";

import { getAuthUser, isNextResponse, requireAuth } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isNextResponse(auth)) return auth;

    const sessionUser = await getAuthUser();

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: auth.id },
      orderBy: { joinedAt: "asc" },
      select: {
        role: true,
        joinedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: { select: { id: true, name: true } },
            _count: { select: { members: true, rooms: true } },
          },
        },
      },
    });

    return NextResponse.json({
      activeOrganizationId: sessionUser?.organizationId ?? null,
      memberships: memberships.map(m => ({
        role: m.role,
        joinedAt: m.joinedAt,
        organization: m.organization,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar organizações do usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
