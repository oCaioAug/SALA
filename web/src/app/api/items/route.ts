import { NextRequest, NextResponse } from "next/server";

import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { canManageRoomItems } from "@/lib/auth/permissions";
import { isNextResponse, toPermissionUser } from "@/lib/auth/platform";
import { isOrgAdminRole } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getRoomInOrganization } from "@/lib/auth/tenant-queries";
import { prisma } from "@/lib/prisma";

const cacheByOrg = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000;

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const now = Date.now();
    const cached = cacheByOrg.get(ctx.organizationId);
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    const items = await prisma.item.findMany({
      where: { organizationId: ctx.organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        specifications: true,
        quantity: true,
        icon: true,
        roomId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: { id: true, filename: true, path: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        room: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    cacheByOrg.set(ctx.organizationId, { data: items, timestamp: now });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const body = await request.json();
    const { name, description, specifications, quantity, icon, roomId } = body;

    if (!name) {
      return apiErrorResponse(ApiErrorCode.ITEM_NAME_REQUIRED, 400);
    }

    const permissionUser = toPermissionUser(ctx.user);

    if (!roomId) {
      if (!isOrgAdminRole(ctx.user.organizationRole)) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
    } else {
      const room = await getRoomInOrganization(roomId, ctx.organizationId);
      if (!room) {
        return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
      }
      const allowed = await canManageRoomItems(permissionUser, room);
      if (!allowed) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        specifications: specifications || [],
        quantity: quantity ? parseInt(quantity, 10) : 1,
        icon,
        roomId: roomId || null,
        organizationId: ctx.organizationId,
      },
      include: { room: true },
    });

    cacheByOrg.delete(ctx.organizationId);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
