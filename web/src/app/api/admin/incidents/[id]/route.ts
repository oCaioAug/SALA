import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { IncidentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { writeAuditLog } from "@/lib/audit";
import { isNextResponse, requireSuperAdmin } from "@/lib/auth/platform";
import { refreshOrganizationDailyStats } from "@/lib/organization/stats";
import { prisma } from "@/lib/prisma";
import { adminIncidentUpdateSchema } from "@/lib/validations/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;

    const incident = await prisma.incident.findUnique({
      where: { id },
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
          select: { id: true, name: true, status: true },
        },
        item: {
          select: { id: true, name: true },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!incident) {
      return apiErrorResponse(ApiErrorCode.INCIDENT_NOT_FOUND, 404);
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Erro ao buscar incidente admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (isNextResponse(auth)) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = adminIncidentUpdateSchema.parse(body);

    const existing = await prisma.incident.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiErrorResponse(ApiErrorCode.INCIDENT_NOT_FOUND, 404);
    }

    if (data.assignedToId) {
      const assignee = await prisma.organizationMember.findFirst({
        where: {
          userId: data.assignedToId,
          organizationId: existing.organizationId,
        },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: "Usuário não pertence à organização do incidente" },
          { status: 400 }
        );
      }
    }

    const updateData: {
      status?: IncidentStatus;
      priority?: typeof data.priority;
      assignedToId?: string | null;
      resolutionNotes?: string | null;
      actualResolutionTime?: Date;
    } = {};

    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedToId !== undefined) {
      updateData.assignedToId = data.assignedToId;
    }
    if (data.resolutionNotes !== undefined) {
      updateData.resolutionNotes = data.resolutionNotes;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (
        data.status === IncidentStatus.RESOLVED &&
        existing.status !== IncidentStatus.RESOLVED
      ) {
        updateData.actualResolutionTime = new Date();
      }
    }

    const updated = await prisma.$transaction(async tx => {
      const incident = await tx.incident.update({
        where: { id },
        data: updateData,
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
      });

      if (data.status !== undefined && data.status !== existing.status) {
        await tx.incidentStatusHistory.create({
          data: {
            incidentId: id,
            fromStatus: existing.status,
            toStatus: data.status,
            notes: "Atualizado pelo super admin da plataforma",
            changedById: auth.id,
          },
        });
      }

      return incident;
    });

    await writeAuditLog({
      actorUserId: auth.id,
      action: "incident.updated_by_super_admin",
      entityType: "Incident",
      entityId: id,
      organizationId: existing.organizationId,
      metadata: {
        previousStatus: existing.status,
        newStatus: data.status ?? existing.status,
      },
    });

    void refreshOrganizationDailyStats(existing.organizationId);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("Erro ao atualizar incidente admin:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
