import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { Prisma, SectorMemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { sectorMemberBodySchema } from "@/lib/validation/sector";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const sector = await prisma.sector.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!sector) {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
    }

    const members = await prisma.sectorMember.findMany({
      where: { sectorId: id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Erro ao listar membros do setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const sector = await prisma.sector.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!sector) {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = sectorMemberBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;

    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: auth.organizationId,
          userId,
        },
      },
      select: { id: true },
    });
    if (!orgMember) {
      return NextResponse.json(
        { error: "Usuário não é membro da organização" },
        { status: 400 }
      );
    }

    try {
      const member = await prisma.sectorMember.create({
        data: {
          sectorId: id,
          userId,
          role: role ?? SectorMemberRole.MANAGER,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });
      return NextResponse.json(member, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Usuário já é membro deste setor" },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro ao adicionar membro ao setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
