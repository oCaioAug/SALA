import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { IncidentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { prisma } from "@/lib/prisma";

const OPEN_STATUSES: IncidentStatus[] = [
  IncidentStatus.REPORTED,
  IncidentStatus.IN_ANALYSIS,
  IncidentStatus.IN_PROGRESS,
];

const CLOSED_STATUSES: IncidentStatus[] = [
  IncidentStatus.RESOLVED,
  IncidentStatus.CANCELLED,
];

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const [open, resolved, criticalOpen, total] = await Promise.all([
      prisma.incident.count({ where: { status: { in: OPEN_STATUSES } } }),
      prisma.incident.count({ where: { status: { in: CLOSED_STATUSES } } }),
      prisma.incident.count({
        where: {
          status: { in: OPEN_STATUSES },
          priority: "CRITICAL",
        },
      }),
      prisma.incident.count(),
    ]);

    return NextResponse.json({ open, resolved, criticalOpen, total });
  } catch (error) {
    console.error("Erro ao buscar stats de incidentes admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
