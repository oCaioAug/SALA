import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  generateFilename,
  uploadImage,
  validateImage,
} from "@/lib/utils/uploadService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const itemName = formData.get("itemName") as string;
    const itemId = formData.get("itemId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhuma imagem fornecida" },
        { status: 400 }
      );
    }

    if (!itemName) {
      return NextResponse.json(
        { error: "Nome do item é obrigatório" },
        { status: 400 }
      );
    }

    // Validar imagem
    const validation = validateImage(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gerar nome do arquivo
    const filename = generateFilename(itemName);

    // Processar e salvar imagem
    const { originalPath, thumbnailPath } = await uploadImage(buffer, filename);

    // Salvar referência no banco de dados
    if (itemId) {
      // Se já existe item, criar imagem associada
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
    } else {
      // Se não existe item ainda, retornar dados para salvar depois
      return NextResponse.json({
        filename,
        path: originalPath,
        thumbnailPath,
        temp: true, // Indica que é temporário, precisa ser associado a um item depois
      });
    }
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao processar imagem" },
      { status: 500 }
    );
  }
}
