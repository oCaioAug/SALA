import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { unlink } from "fs/promises";
import { join } from "path";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const itemId = params.id;

    // Verificar se o usuário é admin
    if (session.user.role !== "ADMIN") {
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
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
