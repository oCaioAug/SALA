import { IncidentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function refreshOrganizationDailyStats(
  organizationId: string,
  date: Date = new Date()
): Promise<void> {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(dayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    reservationsCount,
    activeUsersCount,
    openIncidentsCount,
    roomsCount,
    membersCount,
  ] = await Promise.all([
    prisma.reservation.count({ where: { organizationId } }),
    prisma.reservation
      .findMany({
        where: {
          organizationId,
          startTime: { gte: thirtyDaysAgo },
        },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then(r => r.length),
    prisma.incident.count({
      where: {
        organizationId,
        status: {
          notIn: [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED],
        },
      },
    }),
    prisma.room.count({
      where: { organizationId, deletedAt: null },
    }),
    prisma.organizationMember.count({ where: { organizationId } }),
  ]);

  await prisma.organizationDailyStats.upsert({
    where: {
      organizationId_date: {
        organizationId,
        date: dayStart,
      },
    },
    create: {
      organizationId,
      date: dayStart,
      reservationsCount,
      activeUsersCount,
      openIncidentsCount,
      roomsCount,
      membersCount,
    },
    update: {
      reservationsCount,
      activeUsersCount,
      openIncidentsCount,
      roomsCount,
      membersCount,
    },
  });
}

export async function refreshAllOrganizationsDailyStats(): Promise<number> {
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  for (const org of orgs) {
    await refreshOrganizationDailyStats(org.id);
  }

  return orgs.length;
}
