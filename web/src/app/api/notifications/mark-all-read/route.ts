import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/notifications/mark-all-read - Marcar todas as notificações do usuário como lidas
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    console.log(`🔔 Marcando todas as notificações do usuário ${userId} como lidas`);

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Determinar se userId é um email ou ID
    let actualUserId = userId;
    if (userId.includes('@')) {
      // É um email, buscar o usuário
      const user = await prisma.user.findUnique({
        where: { email: userId },
        select: { id: true }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }
      
      actualUserId = user.id;
      console.log(`🔍 Email ${userId} convertido para ID ${actualUserId}`);
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: actualUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    console.log(`✅ ${result.count} notificações marcadas como lidas`);

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error("❌ Erro ao marcar notificações como lidas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
