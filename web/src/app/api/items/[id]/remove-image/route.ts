import { unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";

import { apiErrorResponse } from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { canManageRoomItems } from "@/lib/auth/permissions";
import { isNextResponse, toPermissionUser } from "@/lib/auth/platform";
import { isOrgAdminRole } from "@/lib/auth/roles";
import { requireTenantContext } from "@/lib/auth/tenant";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireTenantContext();
    if (isNextResponse(ctx)) return ctx;
    if (ctx.isSuperAdmin || !ctx.organizationId) {
      return apiErrorResponse(ApiErrorCode.NO_ORGANIZATION, 403);
    }

    const { id: itemId } = await params;

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        OR: [
          { organizationId: ctx.organizationId },
          { room: { organizationId: ctx.organizationId } },
        ],
      },
      include: {
        images: true,
        room: {
          select: { id: true, organizationId: true, sectorId: true },
        },
      },
    });

    if (!item) {
      return apiErrorResponse(ApiErrorCode.ITEM_NOT_FOUND, 404);
    }

    const permissionUser = toPermissionUser(ctx.user);
    if (item.room) {
      const allowed = await canManageRoomItems(permissionUser, item.room);
      if (!allowed) {
        return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
      }
    } else if (!isOrgAdminRole(ctx.user.organizationRole)) {
      return apiErrorResponse(ApiErrorCode.ACCESS_DENIED, 403);
    }

    for (const image of item.images) {
      try {
        const uploadsDir = join(process.cwd(), "public");
        const originalPath = join(uploadsDir, image.path);
        const thumbPath = join(
          uploadsDir,
          image.path.replace("original_", "thumb_")
        );

        try {
          await unlink(originalPath);
        } catch {
          console.warn("Arquivo original não encontrado:", originalPath);
        }

        try {
          await unlink(thumbPath);
        } catch {
          console.warn("Arquivo thumbnail não encontrado:", thumbPath);
        }
      } catch (error) {
        console.error("Erro ao deletar arquivo de imagem:", error);
      }
    }

    await prisma.image.deleteMany({
      where: { itemId },
    });

    return NextResponse.json({
      message: "Imagem removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover imagem:", error);
    return apiErrorResponse(ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
