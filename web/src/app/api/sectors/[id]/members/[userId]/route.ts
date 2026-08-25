import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id, userId } = await params;
    const sector = await prisma.sector.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      select: { id: true },
    });
    if (!sector) {
      return NextResponse.json(
        { error: "Setor não encontrado" },
        { status: 404 }
      );
    }

    const existing = await prisma.sectorMember.findUnique({
      where: {
        sectorId_userId: { sectorId: id, userId },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Membro não encontrado neste setor" },
        { status: 404 }
      );
    }

    await prisma.sectorMember.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ message: "Membro removido do setor" });
  } catch (error) {
    console.error("Erro ao remover membro do setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
