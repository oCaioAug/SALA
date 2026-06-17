import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { verifyAuth } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return apiErrorResponse(ApiErrorCode.UNAUTHORIZED, 401);
    }

    const body = await request.json();
    const { googleId: _googleId, email, name, image } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    const callerMembership = await prisma.organizationMember.findFirst({
      where: { userId: authResult.user.id },
    });

    if (!callerMembership) {
      return NextResponse.json(
        { error: "Usuário sem organização vinculada" },
        { status: 403 }
      );
    }

    let user = await prisma.user.findFirst({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, image },
      });

      await prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: callerMembership.organizationId,
            userId: user.id,
          },
        },
        create: {
          organizationId: callerMembership.organizationId,
          userId: user.id,
          role: OrganizationRole.MEMBER,
        },
        update: {},
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          memberships: {
            create: {
              organizationId: callerMembership.organizationId,
              role: OrganizationRole.MEMBER,
            },
          },
        },
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Erro ao sincronizar usuário:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
