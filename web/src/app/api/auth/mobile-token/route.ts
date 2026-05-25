import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { toLegacySessionRole } from "@/lib/auth/roles";
import { generateMobileToken } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        platformRole: true,
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
    const token = generateMobileToken(user.email);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationRole: membership?.role ?? null,
        role: toLegacySessionRole({
          platformRole: user.platformRole,
          organizationRole: membership?.role ?? null,
        }),
        avatar: user.image,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar token:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
