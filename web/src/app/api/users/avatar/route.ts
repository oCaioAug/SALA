import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { verifyAuth } from "@/lib/auth-hybrid";
import { prisma } from "@/lib/prisma";
import {
  generateFilename,
  uploadAvatar,
  validateImage,
} from "@/lib/utils/uploadService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação híbrida (web + mobile)
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Não autorizado" },
        { status: authResult.status || 401 }
      );
    }

    // Buscar o usuário autenticado
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhuma imagem fornecida" },
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

    // Gerar nome do arquivo único
    const filename = generateFilename(`avatar-${user.id}`);

    // Processar e salvar imagem
    const { originalPath, thumbnailPath } = await uploadAvatar(
      buffer,
      filename
    );

    // Atualizar o usuário com o novo avatar
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: originalPath },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      imagePath: originalPath,
      thumbnailPath,
      message: "Avatar atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao fazer upload do avatar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação híbrida (web + mobile)
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Não autorizado" },
        { status: authResult.status || 401 }
      );
    }

    // Buscar o usuário autenticado
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Remover o avatar do usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Avatar removido com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao remover avatar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
