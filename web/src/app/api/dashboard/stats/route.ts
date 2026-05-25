import { IncidentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";

import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS = 8;

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const user = ctx.user;
    const isAdmin = isOrgAdmin({
      platformRole: user.platformRole,
      organizationRole: user.organizationRole,
    });

    const now = new Date();
    const horizon = new Date(now.getTime() - WEEKS * WEEK_MS);

    const reservations = await prisma.reservation.findMany({
      where: {
        startTime: { gte: horizon },
        organizationId: ctx.organizationId,
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

    const incidentWhere = {
      organizationId: ctx.organizationId,
      ...(isAdmin
        ? {}
        : {
            OR: [{ reportedById: user.id }, { assignedToId: user.id }],
          }),
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
            organizationId: ctx.organizationId,
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
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
