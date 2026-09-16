import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isManagerOfSector } from "@/lib/auth/permissions";
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
  sectorUpdateBodySchema,
} from "@/lib/validation/sector";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const userIsOrgAdmin = isOrgAdmin({
      platformRole: ctx.user.platformRole,
      organizationRole: ctx.user.organizationRole,
    });

    if (!userIsOrgAdmin) {
      const isManager = await isManagerOfSector(ctx.user.id, id);
      if (!isManager) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
    }

    const sector = await prisma.sector.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
      },
      include: sectorDetailInclude,
    });

    if (!sector) {
      return NextResponse.json(
        { error: "Setor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(sector);
  } catch (error) {
    console.error("Erro ao buscar setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const existing = await prisma.sector.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Setor não encontrado" },
        { status: 404 }
      );
    }

    const json = await request.json();
    const parsed = sectorUpdateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, roomIds } = parsed.data;
    const members = resolveSectorMembersInput(parsed.data);

    if (roomIds !== undefined) {
      const roomsError = await assertRoomsInOrganization(
        roomIds,
        auth.organizationId
      );
      if (roomsError) {
        return NextResponse.json({ error: roomsError }, { status: 400 });
      }
    }

    if (members !== undefined) {
      const membersError = await assertMembersInOrganization(
        members.map(m => m.userId),
        auth.organizationId
      );
      if (membersError) {
        return NextResponse.json({ error: membersError }, { status: 400 });
      }
    }

    try {
      await prisma.sector.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
        },
      });

      if (roomIds !== undefined) {
        await syncSectorRooms(id, auth.organizationId, roomIds);
      }

      if (members !== undefined) {
        await syncSectorMembers(id, members);
      }

      const updated = await prisma.sector.findUnique({
        where: { id },
        include: sectorDetailInclude,
      });

      return NextResponse.json(updated);
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
    console.error("Erro ao atualizar setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const existing = await prisma.sector.findFirst({
      where: {
        id,
        organizationId: auth.organizationId,
      },
      include: {
        _count: { select: { members: true, rooms: true } },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Setor não encontrado" },
        { status: 404 }
      );
    }

    // Room.sectorId is onDelete: SetNull; SectorMember cascades.
    await prisma.sector.delete({ where: { id } });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "sector.deleted",
      entityType: "Sector",
      entityId: id,
      organizationId: auth.organizationId,
      metadata: {
        name: existing.name,
        membersCount: existing._count.members,
        roomsCount: existing._count.rooms,
      },
    });

    return NextResponse.json({ message: "Setor removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
