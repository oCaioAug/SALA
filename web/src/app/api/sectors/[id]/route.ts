import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { Prisma, SectorMemberRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { sectorUpdateBodySchema } from "@/lib/validation/sector";

type RouteParams = { params: Promise<{ id: string }> };

const sectorDetailInclude = {
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

async function syncSectorMembers(sectorId: string, userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) {
    await prisma.sectorMember.deleteMany({ where: { sectorId } });
    return;
  }
  await prisma.$transaction([
    prisma.sectorMember.deleteMany({
      where: {
        sectorId,
        userId: { notIn: uniqueIds },
      },
    }),
    ...uniqueIds.map(userId =>
      prisma.sectorMember.upsert({
        where: {
          sectorId_userId: { sectorId, userId },
        },
        create: {
          sectorId,
          userId,
          role: SectorMemberRole.MANAGER,
        },
        update: {},
      })
    ),
  ]);
}

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
      include: sectorDetailInclude,
    });

    if (!sector) {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
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
        deletedAt: null,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = sectorUpdateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, roomIds, memberUserIds } = parsed.data;

    if (roomIds !== undefined) {
      const roomsError = await assertRoomsInOrganization(
        roomIds,
        auth.organizationId
      );
      if (roomsError) {
        return NextResponse.json({ error: roomsError }, { status: 400 });
      }
    }

    if (memberUserIds !== undefined) {
      const membersError = await assertMembersInOrganization(
        memberUserIds,
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

      if (memberUserIds !== undefined) {
        await syncSectorMembers(id, memberUserIds);
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
        deletedAt: null,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.room.updateMany({
        where: { sectorId: id, organizationId: auth.organizationId },
        data: { sectorId: null },
      }),
      prisma.sector.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Setor arquivado com sucesso" });
  } catch (error) {
    console.error("Erro ao arquivar setor:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
