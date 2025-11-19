import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  uploadAvatar,
  validateImage,
  generateFilename,
} from "@/lib/utils/uploadService";
import { verifyAuth } from "@/lib/auth-hybrid";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação (suporta web e mobile)
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Não autorizado" },
        { status: authResult.status || 401 }
      );
    }

    // Verificar se o usuário pode alterar este perfil
    const targetUserId = params.userId;
    if (
      authResult.user.id !== targetUserId &&
      authResult.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
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
    const validation = await validateImage(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Imagem inválida" },
        { status: 400 }
      );
    }

    // Converter File para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload da imagem
    const filename = generateFilename(`avatar-${targetUser.id}`);

    const { originalPath, thumbnailPath } = await uploadAvatar(
      buffer,
      filename
    );

    // Atualizar o usuário com o novo avatar
    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        image: originalPath,
      },
    });

    console.log("✅ Avatar atualizado via mobile para usuário:", {
      userId: targetUserId,
      originalPath,
      thumbnailPath,
    });

    return NextResponse.json({
      success: true,
      message: "Avatar atualizado com sucesso!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao fazer upload do avatar via mobile:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação (suporta web e mobile)
    const authResult = await verifyAuth(request);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Não autorizado" },
        { status: authResult.status || 401 }
      );
    }

    // Verificar se o usuário pode alterar este perfil
    const targetUserId = params.userId;
    if (
      authResult.user.id !== targetUserId &&
      authResult.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Remover o avatar do usuário
    const updatedUser = await prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        image: null,
      },
    });

    console.log("✅ Avatar removido via mobile para usuário:", targetUserId);

    return NextResponse.json({
      success: true,
      message: "Avatar removido com sucesso!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao remover avatar via mobile:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
