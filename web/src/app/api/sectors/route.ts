import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { Prisma, SectorMemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  isSectorManagerInOrg,
} from "@/lib/auth/permissions";
import {
  isNextResponse,
  requireOrgAdmin,
} from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import { sectorCreateBodySchema } from "@/lib/validation/sector";

const sectorListInclude = {
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  rooms: {
    where: { deletedAt: null },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" as const },
  },
  _count: {
    select: { members: true, rooms: true },
  },
} satisfies Prisma.SectorInclude;

async function assertRoomsInOrganization(
  roomIds: string[],
  organizationId: string
): Promise<string | null> {
  if (roomIds.length === 0) return null;
  const rooms = await prisma.room.findMany({
    where: {
      id: { in: roomIds },
      organizationId,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (rooms.length !== roomIds.length) {
    return "Uma ou mais salas são inválidas ou não pertencem à organização";
  }
  return null;
}

async function syncSectorRooms(
  sectorId: string,
  organizationId: string,
  roomIds: string[]
) {
  await prisma.$transaction([
    prisma.room.updateMany({
      where: {
        organizationId,
        sectorId,
        id: { notIn: roomIds },
        deletedAt: null,
      },
      data: { sectorId: null },
    }),
    prisma.room.updateMany({
      where: {
        organizationId,
        id: { in: roomIds },
        deletedAt: null,
      },
      data: { sectorId },
    }),
  ]);
}

async function assertMembersInOrganization(
  userIds: string[],
  organizationId: string
): Promise<string | null> {
  if (userIds.length === 0) return null;
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      userId: { in: userIds },
    },
    select: { userId: true },
  });
  if (members.length !== userIds.length) {
    return "Um ou mais usuários não são membros da organização";
  }
  return null;
}

async function createSectorMembers(sectorId: string, userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return;
  await prisma.sectorMember.createMany({
    data: uniqueIds.map(userId => ({
      sectorId,
      userId,
      role: SectorMemberRole.MANAGER,
    })),
    skipDuplicates: true,
  });
}

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
      deletedAt: null,
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
      include: sectorListInclude,
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

    const { name, description, roomIds = [], memberUserIds = [] } =
      parsed.data;
    const roomsError = await assertRoomsInOrganization(
      roomIds,
      auth.organizationId
    );
    if (roomsError) {
      return NextResponse.json({ error: roomsError }, { status: 400 });
    }

    const membersError = await assertMembersInOrganization(
      memberUserIds,
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

      if (memberUserIds.length > 0) {
        await createSectorMembers(sector.id, memberUserIds);
      }

      const created = await prisma.sector.findUnique({
        where: { id: sector.id },
        include: sectorListInclude,
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
