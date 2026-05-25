import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth/platform";
import { isOrgAdmin, toLegacySessionRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getAuthUser();
    if (!sessionUser) {
      return apiErrorResponse(ApiErrorCode.UNAUTHORIZED, 401);
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    if (email !== sessionUser.email) {
      if (
        !isOrgAdmin({
          platformRole: sessionUser.platformRole,
          organizationRole: sessionUser.organizationRole,
        })
      ) {
        return NextResponse.json(
          { error: "Você não tem permissão para acessar este perfil" },
          { status: 403 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { role: true },
        },
      },
    });

    if (!user) {
      return apiErrorResponse(ApiErrorCode.USER_NOT_FOUND, 404);
    }

    const membership = user.memberships[0];
    const { memberships: _memberships, ...profile } = user;

    return NextResponse.json({
      ...profile,
      organizationRole: membership?.role ?? null,
      role: toLegacySessionRole({ organizationRole: membership?.role ?? null }),
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
