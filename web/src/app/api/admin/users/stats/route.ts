import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const baseWhere = { deletedAt: null };

    const [total, superAdmins, withOrganization] = await Promise.all([
      prisma.user.count({ where: baseWhere }),
      prisma.user.count({
        where: { ...baseWhere, platformRole: PlatformRole.SUPER_ADMIN },
      }),
      prisma.user.count({
        where: {
          ...baseWhere,
          memberships: { some: {} },
        },
      }),
    ]);

    return NextResponse.json({
      total,
      superAdmins,
      regular: total - superAdmins,
      withOrganization,
      withoutOrganization: total - withOrganization,
    });
  } catch (error) {
    console.error("Erro ao buscar stats de usuários admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
