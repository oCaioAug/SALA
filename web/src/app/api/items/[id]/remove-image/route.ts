import {
  apiErrorResponse,
  apiInternalError,
} from "@/lib/api/api-error-response";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { join } from "path";

import { authOptions } from "@/lib/auth";
import { isOrgAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiErrorResponse(ApiErrorCode.UNAUTHORIZED, 401);
    }

    const { id: itemId } = await params;

    // Verificar se o usuário é admin
    if (
      !isOrgAdmin({
        platformRole: session.user.platformRole,
        organizationRole: session.user.organizationRole,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem remover imagens de itens.",
        },
        { status: 403 }
      );
    }

    // Buscar o item e suas imagens
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { images: true },
    });

    if (!item) {
      return apiErrorResponse(ApiErrorCode.ITEM_NOT_FOUND, 404);
    }

    // Deletar arquivos de imagem do sistema de arquivos
    for (const image of item.images) {
      try {
        const uploadsDir = join(process.cwd(), "public");
        const originalPath = join(uploadsDir, image.path);
        const thumbPath = join(
          uploadsDir,
          image.path.replace("original_", "thumb_")
        );

        // Tentar deletar os arquivos (não falhar se não existirem)
        try {
          await unlink(originalPath);
        } catch (error) {
          console.warn("Arquivo original não encontrado:", originalPath);
        }

        try {
          await unlink(thumbPath);
        } catch (error) {
          console.warn("Arquivo thumbnail não encontrado:", thumbPath);
        }
      } catch (error) {
        console.error("Erro ao deletar arquivo de imagem:", error);
      }
    }

    // Deletar registros de imagem do banco de dados
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
