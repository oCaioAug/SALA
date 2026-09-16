import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const sectorDetailInclude = {
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
    select: {
      members: true,
      rooms: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.SectorInclude;

export async function assertRoomsInOrganization(
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

export async function syncSectorRooms(
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

export async function assertMembersInOrganization(
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
