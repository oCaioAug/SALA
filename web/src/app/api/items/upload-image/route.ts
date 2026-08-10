import { NextRequest, NextResponse } from "next/server";

import {
  apiErrorResponse,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { canManageRoomItems } from "@/lib/auth/permissions";
import { isNextResponse, toPermissionUser } from "@/lib/auth/platform";
import { isOrgAdminRole } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";
import {
  generateFilename,
  uploadImage,
  validateImage,
} from "@/lib/utils/uploadService";

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const itemName = formData.get("itemName") as string;
    const itemId = formData.get("itemId") as string | null;

    if (!file) {
      return apiErrorResponse(ApiErrorCode.NO_IMAGE, 400);
    }

    if (!itemName) {
      return apiErrorResponse(ApiErrorCode.ITEM_NAME_REQUIRED, 400);
    }

    const permissionUser = toPermissionUser(ctx.user);

    if (itemId) {
      const item = await prisma.item.findFirst({
        where: {
          id: itemId,
          OR: [
            { organizationId: ctx.organizationId },
            { room: { organizationId: ctx.organizationId } },
          ],
        },
        include: {
          room: {
            select: { id: true, organizationId: true, sectorId: true },
          },
        },
      });

      if (!item) {
        return apiErrorResponse(ApiErrorCode.ITEM_NOT_FOUND, 404);
      }

      if (item.room) {
        const allowed = await canManageRoomItems(permissionUser, item.room);
        if (!allowed) {
          return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
        }
      } else if (!isOrgAdminRole(ctx.user.organizationRole)) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
    } else if (!isOrgAdminRole(ctx.user.organizationRole)) {
      // Temp upload before item exists: only org admins, or managers who
      // already passed room-scoped create. Managers must attach itemId after create.
      // Allow sector managers to upload temp files only if they manage at least one room
      // — prefer requiring roomId for managers.
      const roomId = formData.get("roomId") as string | null;
      if (!roomId) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          organizationId: ctx.organizationId,
          deletedAt: null,
        },
        select: { id: true, organizationId: true, sectorId: true },
      });
      if (!room) {
        return apiErrorResponse(ApiErrorCode.ROOM_NOT_FOUND, 404);
      }
      const allowed = await canManageRoomItems(permissionUser, room);
      if (!allowed) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
    }

    const validation = validateImage(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = generateFilename(itemName);

    const { originalPath, thumbnailPath } = await uploadImage(buffer, filename);

    if (itemId) {
      const image = await prisma.image.create({
        data: {
          itemId,
          filename,
          path: originalPath,
        },
      });

      return NextResponse.json({
        id: image.id,
        filename: image.filename,
        path: image.path,
        thumbnailPath,
        itemId: image.itemId,
      });
    }

    return NextResponse.json({
      filename,
      path: originalPath,
      thumbnailPath,
      temp: true,
    });
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar imagem" },
      { status: 500 }
    );
  }
}
