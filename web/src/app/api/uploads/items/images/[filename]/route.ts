import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'items', 'images');

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    
    // Validar nome do arquivo (prevenir path traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Nome de arquivo inválido' },
        { status: 400 }
      );
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    // Verificar se arquivo existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      );
    }

    // Ler arquivo
    const fileBuffer = await fs.readFile(filePath);

    // Determinar content-type baseado na extensão
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';
    
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    // Retornar imagem com headers apropriados
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar imagem' },
      { status: 500 }
    );
  }
}

