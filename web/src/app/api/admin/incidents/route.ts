import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { IncidentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";
import { adminIncidentsQuerySchema } from "@/lib/validations/admin";

const OPEN_STATUSES: IncidentStatus[] = [
  IncidentStatus.REPORTED,
  IncidentStatus.IN_ANALYSIS,
  IncidentStatus.IN_PROGRESS,
];

const CLOSED_STATUSES: IncidentStatus[] = [
  IncidentStatus.RESOLVED,
  IncidentStatus.CANCELLED,
];

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { searchParams } = new URL(request.url);
    const query = adminIncidentsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      organizationId: searchParams.get("organizationId") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });

    const where = {
      ...(query.organizationId
        ? { organizationId: query.organizationId }
        : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.status
        ? { status: query.status }
        : query.scope === "open"
          ? { status: { in: OPEN_STATUSES } }
          : query.scope === "resolved"
            ? { status: { in: CLOSED_STATUSES } }
            : {}),
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
              {
                organization: {
                  name: {
                    contains: query.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [total, incidents] = await Promise.all([
      prisma.incident.count({ where }),
      prisma.incident.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
          reportedBy: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          room: {
            select: { id: true, name: true },
          },
          item: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: incidents,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  } catch (error) {
    console.error("Erro ao listar incidentes admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
