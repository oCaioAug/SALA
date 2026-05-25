import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { adminUsersQuerySchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const query = adminUsersQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      platformRole: searchParams.get("platformRole") ?? undefined,
      includeDeleted: searchParams.get("includeDeleted") ?? undefined,
    });

    const where = {
      ...(query.includeDeleted ? {} : { deletedAt: null }),
      ...(query.platformRole ? { platformRole: query.platformRole } : {}),
      ...(query.search
        ? {
            OR: [
              {
                email: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
        deletedAt: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
