import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Force dynamic behavior to prevent static optimization
export const dynamic = "force-dynamic";

// GET /api/notifications/count - Contar notificações não lidas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log("🔔 Contando notificações não lidas para usuário:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar usuário por ID ou email
    let user;
    if (userId.includes("@")) {
      // Se contém @, é um email
      user = await prisma.user.findUnique({
        where: { email: userId },
      });
    } else {
      // Senão, é um ID
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      console.log(`❌ Usuário não encontrado: ${userId}`);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    console.log(
      `✅ Usuário ${user.email} (${user.id}) tem ${count} notificações não lidas`
    );

    return NextResponse.json({ count });
  } catch (error) {
    console.error("❌ Erro ao contar notificações:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
