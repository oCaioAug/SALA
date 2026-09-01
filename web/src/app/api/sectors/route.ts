import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isSectorManagerInOrg } from "@/lib/auth/permissions";
import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import { syncSectorMembers } from "@/lib/sectors/members";
import {
  assertMembersInOrganization,
  assertRoomsInOrganization,
  sectorDetailInclude,
  syncSectorRooms,
} from "@/lib/sectors/sync";
import {
  resolveSectorMembersInput,
  sectorCreateBodySchema,
} from "@/lib/validation/sector";

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const userIsOrgAdmin = isOrgAdmin({
      platformRole: ctx.user.platformRole,
      organizationRole: ctx.user.organizationRole,
    });

    const where: Prisma.SectorWhereInput = {
      organizationId: ctx.organizationId,
    };

    if (!userIsOrgAdmin) {
      const isManager = await isSectorManagerInOrg(
        ctx.user.id,
        ctx.organizationId
      );
      if (!isManager) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
      where.members = {
        some: { userId: ctx.user.id },
      };
    }

    const sectors = await prisma.sector.findMany({
      where,
      include: sectorDetailInclude,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(sectors);
  } catch (error) {
    console.error("Erro ao listar setores:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const json = await request.json();
    const parsed = sectorCreateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, roomIds = [] } = parsed.data;
    const members = resolveSectorMembersInput(parsed.data) ?? [];
    const roomsError = await assertRoomsInOrganization(
      roomIds,
      auth.organizationId
    );
    if (roomsError) {
      return NextResponse.json({ error: roomsError }, { status: 400 });
    }

    const membersError = await assertMembersInOrganization(
      members.map(m => m.userId),
      auth.organizationId
    );
    if (membersError) {
      return NextResponse.json({ error: membersError }, { status: 400 });
    }

    try {
      const sector = await prisma.sector.create({
        data: {
          name,
          description: description ?? null,
          organizationId: auth.organizationId,
        },
      });

      if (roomIds.length > 0) {
        await syncSectorRooms(sector.id, auth.organizationId, roomIds);
      }

      if (members.length > 0) {
        await syncSectorMembers(sector.id, members);
      }

      const created = await prisma.sector.findUnique({
        where: { id: sector.id },
        include: sectorDetailInclude,
      });

      return NextResponse.json(created, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Já existe um setor com este nome na organização" },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro ao criar setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
