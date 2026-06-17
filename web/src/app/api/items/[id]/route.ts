import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { isNextResponse } from "@/lib/auth/platform";
import { requireTenantContext } from "@/lib/auth/tenant";
import {
  getItemInOrganization,
  getRoomInOrganization,
} from "@/lib/auth/tenant-queries";
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
    const item = await getItemInOrganization(id, ctx.organizationId);
    if (!item) {
      return apiErrorResponse(ApiErrorCode.ITEM_NOT_FOUND, 404);
    }

    const full = await prisma.item.findUnique({
      where: { id },
      include: {
        room: true,
        images: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(full);
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const currentItem = await getItemInOrganization(id, ctx.organizationId);
    if (!currentItem) {
      return apiErrorResponse(ApiErrorCode.ITEM_NOT_FOUND, 404);
    }

    const body = await request.json();
    const { name, description, specifications, quantity, icon, roomId } = body;

    if (roomId !== undefined && roomId !== null) {
      const room = await getRoomInOrganization(roomId, ctx.organizationId);
      if (!room) {
        return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
      }
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        specifications: specifications || [],
        quantity: quantity ? parseInt(quantity, 10) : 1,
        icon,
        ...(roomId !== undefined && { roomId }),
      },
      include: {
        room: true,
        images: {
          select: { id: true, filename: true, path: true },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id } = await params;
    const item = await prisma.item.findFirst({
      where: {
        id,
        OR: [
          { organizationId: ctx.organizationId },
          { room: { organizationId: ctx.organizationId } },
        ],
      },
      include: { images: true },
    });

    if (!item) {
      return apiErrorResponse(ApiErrorCode.ITEM_NOT_FOUND, 404);
    }

    const { deleteImageFiles } = await import("@/lib/utils/imageProcessor");
    for (const image of item.images) {
      await deleteImageFiles(image.filename);
    }

    await prisma.item.delete({ where: { id } });

    return NextResponse.json({ message: "Item deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
