import { prisma } from "@/lib/prisma";

export async function getRoomInOrganization(
  roomId: string,
  organizationId: string
) {
  return prisma.room.findFirst({
    where: { id: roomId, organizationId, deletedAt: null },
  });
}

export async function getReservationInOrganization(
  reservationId: string,
  organizationId: string
) {
  return prisma.reservation.findFirst({
    where: { id: reservationId, organizationId },
    include: {
      room: {
        select: {
          id: true,
          organizationId: true,
          sectorId: true,
          name: true,
        },
      },
      user: true,
    },
  });
}

export async function getIncidentInOrganization(
  incidentId: string,
  organizationId: string
) {
  return prisma.incident.findFirst({
    where: { id: incidentId, organizationId },
  });
}

export async function getItemInOrganization(
  itemId: string,
  organizationId: string
) {
  return prisma.item.findFirst({
    where: {
      id: itemId,
      OR: [{ organizationId }, { room: { organizationId } }],
    },
  });
}

export async function getOrgMemberUserIds(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    select: { userId: true },
  });
  return members.map(m => m.userId);
}
