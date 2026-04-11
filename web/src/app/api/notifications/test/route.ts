import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// POST /api/notifications/test - Criar notificação de teste
export async function POST(request: NextRequest) {
  try {
    const { userId, title, message } = await request.json();

    console.log("Criando notificação de teste:", { userId, title, message });

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId,
        type: "SYSTEM_ANNOUNCEMENT",
        title: title || "Notificação de Teste",
        message: message || "Esta é uma notificação de teste criada pela API.",
        data: { source: "test-api" },
        isRead: false,
      },
    });

    console.log("Notificação de teste criada:", notification.id);

    return NextResponse.json({
      success: true,
      notification,
      message: "Notificação de teste criada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao criar notificação de teste:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
