import {
  IncidentStatus,
  OrganizationStatus,
  SubscriptionStatus,
} from "@prisma/client";
import { NextResponse } from "next/server";
import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKS = 8;

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const horizon = new Date(now.getTime() - WEEKS * WEEK_MS);
    const activeOrgFilter = { deletedAt: null };

    const [
      organizationsByStatus,
      totalUsers,
      totalRooms,
      reservationsLast30Days,
      openIncidents,
      organizations,
      users,
      weeklyOrgs,
      reservationGroups,
      plansDistribution,
      expiringTrials,
      inactiveOrgs,
    ] = await Promise.all([
      prisma.organization.groupBy({
        by: ["status"],
        where: activeOrgFilter,
        _count: { id: true },
      }),
      prisma.user.count({
        where: { platformRole: "NONE", deletedAt: null },
      }),
      prisma.room.count({ where: { deletedAt: null } }),
      prisma.reservation.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.incident.count({
        where: {
          status: {
            notIn: [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED],
          },
        },
      }),
      prisma.organization.findMany({
        where: activeOrgFilter,
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { members: true, rooms: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          platformRole: "NONE",
          createdAt: { gte: horizon },
          deletedAt: null,
        },
        select: { createdAt: true },
      }),
      prisma.organization.findMany({
        where: { ...activeOrgFilter, createdAt: { gte: horizon } },
        select: { createdAt: true },
      }),
      prisma.reservation.groupBy({
        by: ["organizationId"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.organization.groupBy({
        by: ["planId"],
        where: activeOrgFilter,
        _count: { id: true },
      }),
      prisma.subscription.findMany({
        where: {
          status: {
            in: [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE],
          },
          currentPeriodEnd: {
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            gte: now,
          },
          organization: activeOrgFilter,
        },
        include: {
          organization: { select: { id: true, name: true, status: true } },
          plan: { select: { name: true } },
        },
        orderBy: { currentPeriodEnd: "asc" },
        take: 10,
      }),
      prisma.organization.findMany({
        where: {
          ...activeOrgFilter,
          status: OrganizationStatus.ACTIVE,
          reservations: { none: { createdAt: { gte: thirtyDaysAgo } } },
        },
        select: { id: true, name: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const orgStatusCounts = {
      active: 0,
      suspended: 0,
      trial: 0,
      total: organizations.length,
    };
    for (const row of organizationsByStatus) {
      if (row.status === OrganizationStatus.ACTIVE) {
        orgStatusCounts.active = row._count.id;
      } else if (row.status === OrganizationStatus.SUSPENDED) {
        orgStatusCounts.suspended = row._count.id;
      } else if (row.status === OrganizationStatus.TRIAL) {
        orgStatusCounts.trial = row._count.id;
      }
    }

    const tNow = now.getTime();
    const boundaries: number[] = [];
    for (let k = 0; k <= WEEKS; k++) {
      boundaries.push(tNow - (WEEKS - k) * WEEK_MS);
    }

    const weeklyNewOrganizations = Array.from({ length: WEEKS }, (_, i) => ({
      key: `w${i}`,
      label: new Date(boundaries[i]).toISOString().slice(0, 10),
      count: 0,
    }));

    const weeklyNewUsers = Array.from({ length: WEEKS }, (_, i) => ({
      key: `w${i}`,
      label: new Date(boundaries[i]).toISOString().slice(0, 10),
      count: 0,
    }));

    for (const org of weeklyOrgs) {
      const t = new Date(org.createdAt).getTime();
      for (let i = 0; i < WEEKS; i++) {
        const end = i === WEEKS - 1 ? tNow + 1 : boundaries[i + 1];
        if (t >= boundaries[i] && t < end) {
          weeklyNewOrganizations[i].count++;
          break;
        }
      }
    }

    for (const u of users) {
      const t = new Date(u.createdAt).getTime();
      for (let i = 0; i < WEEKS; i++) {
        const end = i === WEEKS - 1 ? tNow + 1 : boundaries[i + 1];
        if (t >= boundaries[i] && t < end) {
          weeklyNewUsers[i].count++;
          break;
        }
      }
    }

    const orgNameMap = Object.fromEntries(
      organizations.map(o => [o.id, o.name])
    );

    const topOrganizationsByReservations = reservationGroups.map(g => ({
      id: g.organizationId,
      name: orgNameMap[g.organizationId] ?? g.organizationId,
      count: g._count.id,
    }));

    const planRecords = await prisma.plan.findMany({
      select: { id: true, name: true },
    });
    const planNameMap = Object.fromEntries(
      planRecords.map(p => [p.id, p.name])
    );

    const organizationsByPlan = plansDistribution.map(row => ({
      planId: row.planId,
      planName: row.planId
        ? (planNameMap[row.planId] ?? row.planId)
        : "Sem plano",
      count: row._count.id,
    }));

    const activeOrgsWithReservations = await prisma.organization.count({
      where: {
        ...activeOrgFilter,
        reservations: { some: { createdAt: { gte: thirtyDaysAgo } } },
      },
    });

    const retentionRate =
      orgStatusCounts.total > 0
        ? Math.round((activeOrgsWithReservations / orgStatusCounts.total) * 100)
        : 0;

    return NextResponse.json({
      organizations: orgStatusCounts,
      totalUsers,
      totalRooms,
      reservationsLast30Days,
      openIncidents,
      weeklyNewOrganizations,
      weeklyNewUsers,
      topOrganizationsByReservations,
      organizationsByPlan,
      expiringTrials: expiringTrials.map(s => ({
        organizationId: s.organizationId,
        organizationName: s.organization.name,
        organizationStatus: s.organization.status,
        planName: s.plan.name,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
      inactiveOrganizations: inactiveOrgs,
      activeOrganizationsLast30Days: activeOrgsWithReservations,
      retentionRate,
    });
  } catch (error) {
    console.error("Erro ao buscar stats admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
