import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { OrganizationRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { isOrgAdmin } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
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

    const orgFilter = { organizationId: ctx.organizationId };
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const baseWhere = isAdmin
      ? orgFilter
      : {
          ...orgFilter,
          OR: [{ reportedById: user.id }, { assignedToId: user.id }],
        };

    const [
      totalIncidents,
      reportedIncidents,
      inAnalysisIncidents,
      inProgressIncidents,
      resolvedIncidents,
      criticalIncidents,
      highIncidents,
      mediumIncidents,
      lowIncidents,
      incidentsByCategory,
      resolvedIncidentsWithTime,
      affectedRooms,
      affectedItems,
    ] = await Promise.all([
      prisma.incident.count({ where: baseWhere }),
      prisma.incident.count({ where: { ...baseWhere, status: "REPORTED" } }),
      prisma.incident.count({ where: { ...baseWhere, status: "IN_ANALYSIS" } }),
      prisma.incident.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
      prisma.incident.count({ where: { ...baseWhere, status: "RESOLVED" } }),
      prisma.incident.count({
        where: {
          ...baseWhere,
          priority: "CRITICAL",
          status: { not: "RESOLVED" },
        },
      }),
      prisma.incident.count({
        where: { ...baseWhere, priority: "HIGH", status: { not: "RESOLVED" } },
      }),
      prisma.incident.count({
        where: {
          ...baseWhere,
          priority: "MEDIUM",
          status: { not: "RESOLVED" },
        },
      }),
      prisma.incident.count({
        where: { ...baseWhere, priority: "LOW", status: { not: "RESOLVED" } },
      }),
      prisma.incident.groupBy({
        by: ["category"],
        _count: { _all: true },
        where: { ...orgFilter, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.incident.findMany({
        where: {
          ...orgFilter,
          status: "RESOLVED",
          actualResolutionTime: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, actualResolutionTime: true },
      }),
      prisma.incident.groupBy({
        by: ["roomId"],
        _count: { roomId: true },
        where: {
          ...orgFilter,
          roomId: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { _count: { roomId: "desc" } },
        take: 5,
      }),
      prisma.incident.groupBy({
        by: ["itemId"],
        _count: { itemId: true },
        where: {
          ...orgFilter,
          itemId: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { _count: { itemId: "desc" } },
        take: 5,
      }),
    ]);

    let personalStats = null;
    if (!isAdmin) {
      personalStats = {
        reported: await prisma.incident.count({
          where: { ...orgFilter, reportedById: user.id },
        }),
        assigned: await prisma.incident.count({
          where: {
            ...orgFilter,
            assignedToId: user.id,
            status: { not: "RESOLVED" },
          },
        }),
        assignedResolved: await prisma.incident.count({
          where: {
            ...orgFilter,
            assignedToId: user.id,
            status: "RESOLVED",
          },
        }),
      };
    }

    let averageResolutionTimeHours = 0;
    if (resolvedIncidentsWithTime.length > 0) {
      const totalResolutionTime = resolvedIncidentsWithTime.reduce(
        (sum, incident) => {
          if (incident.actualResolutionTime) {
            return (
              sum +
              (incident.actualResolutionTime.getTime() -
                incident.createdAt.getTime())
            );
          }
          return sum;
        },
        0
      );
      averageResolutionTimeHours = Math.round(
        totalResolutionTime /
          resolvedIncidentsWithTime.length /
          (1000 * 60 * 60)
      );
    }

    const roomIds = affectedRooms
      .map(r => r.roomId)
      .filter((id): id is string => id !== null);
    const itemIds = affectedItems
      .map(i => i.itemId)
      .filter((id): id is string => id !== null);

    const [roomNames, itemNames] = await Promise.all([
      roomIds.length > 0
        ? prisma.room.findMany({
            where: { id: { in: roomIds }, organizationId: ctx.organizationId },
            select: { id: true, name: true },
          })
        : [],
      itemIds.length > 0
        ? prisma.item.findMany({
            where: { id: { in: itemIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const roomNameMap = Object.fromEntries(roomNames.map(r => [r.id, r.name]));
    const itemNameMap = Object.fromEntries(itemNames.map(i => [i.id, i.name]));

    return NextResponse.json({
      overview: {
        total: totalIncidents,
        reported: reportedIncidents,
        inAnalysis: inAnalysisIncidents,
        inProgress: inProgressIncidents,
        resolved: resolvedIncidents,
        activeTotal:
          reportedIncidents + inAnalysisIncidents + inProgressIncidents,
      },
      priority: {
        critical: criticalIncidents,
        high: highIncidents,
        medium: mediumIncidents,
        low: lowIncidents,
      },
      personal: personalStats,
      categories: incidentsByCategory.map(cat => ({
        category: cat.category,
        count: cat._count._all,
      })),
      performance: {
        averageResolutionTimeHours,
        resolvedLast30Days: resolvedIncidentsWithTime.length,
      },
      mostAffected: {
        rooms: affectedRooms.map(room => ({
          id: room.roomId,
          name: roomNameMap[room.roomId!] || "Sala desconhecida",
          incidents: room._count.roomId,
        })),
        items: affectedItems.map(item => ({
          id: item.itemId,
          name: itemNameMap[item.itemId!] || "Item desconhecido",
          incidents: item._count.itemId,
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de incidentes:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
