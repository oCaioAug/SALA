import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;

    if (!filename) {
      return NextResponse.json(
        { error: "Nome do arquivo não fornecido" },
        { status: 400 }
      );
    }

    // Construir o caminho do arquivo
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "avatars",
      filename
    );

    // Verificar se o arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Ler o arquivo
    const fileBuffer = await fs.readFile(filePath);

    // Determinar o tipo de conteúdo
    let contentType = "image/jpeg";
    const extension = path.extname(filename).toLowerCase();

    switch (extension) {
      case ".png":
        contentType = "image/png";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      default:
        contentType = "image/jpeg";
    }

    // Retornar a imagem
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache por 1 dia
        ETag: `"${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao servir avatar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
