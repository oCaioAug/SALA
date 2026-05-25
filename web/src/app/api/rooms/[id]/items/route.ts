import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse, requireOrgAdmin } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import { getRoomInOrganization } from "@/lib/auth/tenant-queries";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const room = await getRoomInOrganization(id, ctx.organizationId);
    if (!room) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    const items = await prisma.item.findMany({
      where: { roomId: id, organizationId: ctx.organizationId },
      include: {
        images: {
          select: { id: true, filename: true, path: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Erro ao buscar itens da sala:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireOrgAdmin();
    if (isNextResponse(auth)) return auth;
    if (!auth.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const room = await getRoomInOrganization(id, auth.organizationId);
    if (!room) {
      return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
    }

    const body = await request.json();
    const { name, description, specifications, quantity, icon } = body;

    if (!name) {
      return apiErrorResponse(ApiErrorCode.ITEM_NAME_REQUIRED, 400);
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        specifications: specifications || [],
        quantity: quantity ? parseInt(quantity, 10) : 1,
        icon,
        roomId: id,
        organizationId: auth.organizationId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar item:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
