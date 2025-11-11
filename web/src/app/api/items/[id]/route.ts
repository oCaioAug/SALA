import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        room: true,
        images: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, specifications, quantity, icon, roomId } = body;

    // Buscar o item atual para preservar dados existentes se necessário
    const currentItem = await prisma.item.findUnique({
      where: { id: params.id },
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 }
      );
    }

    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        name,
        description,
        specifications: specifications || [],
        quantity: quantity ? parseInt(quantity) : 1,
        icon,
        // Só atualiza roomId se for fornecido explicitamente, senão mantém o atual
        ...(roomId !== undefined && { roomId }),
      },
      include: {
        room: true,
        images: {
          select: {
            id: true,
            filename: true,
            path: true,
          },
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar imagens do item antes de deletar
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: { images: true },
    });

    if (item) {
      // Deletar arquivos de imagem
      const { deleteImageFiles } = await import("@/lib/utils/imageProcessor");
      for (const image of item.images) {
        await deleteImageFiles(image.filename);
      }
    }

    // Deletar item (as imagens serão deletadas automaticamente pelo cascade)
    await prisma.item.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Item deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
