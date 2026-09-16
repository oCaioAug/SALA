import { SectorMemberRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SectorMemberCapabilitiesInput } from "@/lib/validation/sector";

export async function syncSectorMembers(
  sectorId: string,
  members: SectorMemberCapabilitiesInput[]
) {
  const unique = new Map<string, SectorMemberCapabilitiesInput>();
  for (const member of members) {
    unique.set(member.userId, member);
  }
  const list = [...unique.values()];

  if (list.length === 0) {
    await prisma.sectorMember.deleteMany({ where: { sectorId } });
    return;
  }

  const userIds = list.map(member => member.userId);

  await prisma.$transaction([
    prisma.sectorMember.deleteMany({
      where: {
        sectorId,
        userId: { notIn: userIds },
      },
    }),
    ...list.map(member =>
      prisma.sectorMember.upsert({
        where: {
          sectorId_userId: { sectorId, userId: member.userId },
        },
        create: {
          sectorId,
          userId: member.userId,
          role: SectorMemberRole.MANAGER,
          canApproveReservations: member.canApproveReservations,
          canManageRooms: member.canManageRooms,
        },
        update: {
          canApproveReservations: member.canApproveReservations,
          canManageRooms: member.canManageRooms,
        },
      })
    ),
  ]);
}
