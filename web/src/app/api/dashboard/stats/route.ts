import { IncidentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS = 8;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";
    const now = new Date();
    const horizon = new Date(now.getTime() - WEEKS * WEEK_MS);

    const reservations = await prisma.reservation.findMany({
      where: {
        startTime: { gte: horizon },
        ...(isAdmin ? {} : { userId: user.id }),
      },
      select: {
        id: true,
        startTime: true,
        status: true,
        roomId: true,
        room: { select: { name: true } },
      },
    });

    const tNow = now.getTime();
    const boundaries: number[] = [];
    for (let k = 0; k <= WEEKS; k++) {
      boundaries.push(tNow - (WEEKS - k) * WEEK_MS);
    }

    const weeklyReservations = Array.from({ length: WEEKS }, (_, i) => {
      const start = new Date(boundaries[i]);
      return {
        key: `w${i}`,
        label: start.toISOString().slice(0, 10),
        count: 0,
      };
    });

    for (const r of reservations) {
      const t = new Date(r.startTime).getTime();
      if (t < boundaries[0] || t > tNow) continue;
      for (let i = 0; i < WEEKS; i++) {
        const end = i === WEEKS - 1 ? tNow + 1 : boundaries[i + 1];
        if (t >= boundaries[i] && t < end) {
          weeklyReservations[i].count++;
          break;
        }
      }
    }

    const statusMap = new Map<string, number>();
    for (const r of reservations) {
      statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    }
    const reservationStatus = [...statusMap.entries()].map(
      ([status, count]) => ({ status, count })
    );

    const roomCountMap = new Map<string, { name: string; count: number }>();
    for (const r of reservations) {
      if (!r.roomId) continue;
      const name = r.room?.name ?? r.roomId;
      const cur = roomCountMap.get(r.roomId);
      if (cur) cur.count++;
      else roomCountMap.set(r.roomId, { name, count: 1 });
    }

    const topRooms = [...roomCountMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const incidentWhere = isAdmin
      ? {}
      : {
          OR: [
            { reportedById: user.id },
            { assignedToId: user.id },
          ],
        };

    const OPEN_STATUSES: IncidentStatus[] = [
      "REPORTED",
      "IN_ANALYSIS",
      "IN_PROGRESS",
    ];

    const [incidentGroups, incidentTotal, incidentOpen, pendingSolicitations] =
      await Promise.all([
        prisma.incident.groupBy({
          by: ["status"],
          where: incidentWhere,
          _count: { _all: true },
        }),
        prisma.incident.count({ where: incidentWhere }),
        prisma.incident.count({
          where: {
            ...incidentWhere,
            status: { in: OPEN_STATUSES },
          },
        }),
        prisma.reservation.count({
          where: {
            status: "PENDING",
            ...(isAdmin ? {} : { userId: user.id }),
          },
        }),
      ]);

    const statusOrder: IncidentStatus[] = [
      "REPORTED",
      "IN_ANALYSIS",
      "IN_PROGRESS",
      "RESOLVED",
      "CANCELLED",
    ];
    const incidentCountByStatus = new Map(
      incidentGroups.map(g => [g.status, g._count._all])
    );
    const incidentsByStatus = statusOrder
      .map(status => ({
        status,
        count: incidentCountByStatus.get(status) ?? 0,
      }))
      .filter(row => row.count > 0);

    return NextResponse.json({
      weeklyReservations,
      reservationStatus,
      topRooms,
      scope: isAdmin ? "all" : "mine",
      incidents: {
        byStatus: incidentsByStatus,
        total: incidentTotal,
        open: incidentOpen,
      },
      solicitations: {
        pending: pendingSolicitations,
      },
    });
  } catch (error) {
    console.error("[dashboard/stats] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
