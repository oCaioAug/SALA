import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { IncidentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { getOrganizationUsage } from "@/lib/organization/plan-limits";
import { prisma } from "@/lib/prisma";
import { updateOrganizationSchema } from "@/lib/validations/admin";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            maxRooms: true,
            maxUsers: true,
            maxReservationsPerMonth: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { members: true, rooms: true } },
      },
    });

    if (!organization) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [reservationsCount, openIncidentsCount, rooms, usage] =
      await Promise.all([
        prisma.reservation.count({
          where: {
            organizationId: id,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.incident.count({
          where: {
            organizationId: id,
            status: {
              notIn: [IncidentStatus.RESOLVED, IncidentStatus.CANCELLED],
            },
          },
        }),
        prisma.room.findMany({
          where: { organizationId: id, deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            createdAt: true,
          },
          orderBy: { name: "asc" },
        }),
        getOrganizationUsage(id),
      ]);

    return NextResponse.json({
      ...organization,
      metrics: {
        reservationsLast30Days: reservationsCount,
        openIncidents: openIncidentsCount,
      },
      usage,
      rooms,
    });
  } catch (error) {
    console.error("Erro ao buscar organização:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = updateOrganizationSchema.parse(body);

    const existing = await prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      return apiErrorResponse(ApiErrorCode.ORGANIZATION_NOT_FOUND, 404);
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.organization.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        return apiErrorResponse(ApiErrorCode.SLUG_IN_USE, 409);
      }
    }

    const organization = await prisma.organization.update({
      where: { id },
      data,
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { members: true, rooms: true } },
      },
    });

    const auditAction =
      data.status && data.status !== existing.status
        ? "organization.status_changed"
        : "organization.updated";

    await writeAuditLog({
      actorUserId: auth.id,
      action: auditAction,
      entityType: "Organization",
      entityId: id,
      organizationId: id,
      metadata: {
        before: {
          name: existing.name,
          slug: existing.slug,
          status: existing.status,
          planId: existing.planId,
        },
        after: data,
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Erro ao atualizar organização:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
