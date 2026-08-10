import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { canEditRoom, canManageRoomItems } from "@/lib/auth/permissions";
import {
  isNextResponse,
  requireOrgAdmin,
  toPermissionUser,
} from "@/lib/auth/platform";
import { isOrgAdminRole } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getRoomInOrganization } from "@/lib/auth/tenant-queries";
import { prisma } from "@/lib/prisma";
import { roomUpdateBodySchema } from "@/lib/validation/room";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin) {
      return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
    }

    const { id } = await params;
    const room = await prisma.room.findFirst({
      where: { id, organizationId: ctx.organizationId, deletedAt: null },
      include: {
        sector: { select: { id: true, name: true } },
        items: {
          include: {
            images: {
              select: { id: true, filename: true, path: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
        reservations: {
          where: { status: "ACTIVE" },
          include: { user: true },
        },
      },
    });

    if (!room) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    const permissionUser = toPermissionUser(ctx.user);
    const [canManageItems, canEdit] = await Promise.all([
      canManageRoomItems(permissionUser, room),
      canEditRoom(permissionUser, room),
    ]);

    return NextResponse.json({
      ...room,
      canManageItems,
      canEditRoom: canEdit,
    });
  } catch (error) {
    console.error("Erro ao buscar sala:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin) {
      return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
    }
    if (!ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const existing = await getRoomInOrganization(id, ctx.organizationId);
    if (!existing) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    const permissionUser = toPermissionUser(ctx.user);
    const allowed = await canEditRoom(permissionUser, existing);
    if (!allowed) {
      return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
    }

    const json = await request.json();
    const parsed = roomUpdateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const isAdmin = isOrgAdminRole(ctx.user.organizationRole);

    // Only org admins may reassign the room's sector.
    if (isAdmin && data.sectorId) {
      const sector = await prisma.sector.findFirst({
        where: {
          id: data.sectorId,
          organizationId: ctx.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!sector) {
        return NextResponse.json(
          { error: "Setor inválido ou não pertence à organização" },
          { status: 400 }
        );
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.locationDescription !== undefined && {
          locationDescription: data.locationDescription,
        }),
        ...(data.outletCount !== undefined && {
          outletCount: data.outletCount,
        }),
        ...(data.climateControlled !== undefined && {
          climateControlled: data.climateControlled,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(isAdmin &&
          data.sectorId !== undefined && { sectorId: data.sectorId }),
      },
      include: {
        sector: { select: { id: true, name: true } },
        items: {
          include: {
            images: {
              select: { id: true, filename: true, path: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("Erro ao atualizar sala:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const existing = await getRoomInOrganization(id, auth.organizationId);
    if (!existing) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    await prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Sala deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar sala:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
