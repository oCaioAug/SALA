import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { toLegacySessionRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: auth.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    const users = members.map(m => ({
      ...m.user,
      organizationRole: m.role,
      role: toLegacySessionRole({ organizationRole: m.role }),
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
