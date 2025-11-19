import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/notifications/debug - Listar todas as notificações para debug
export async function GET() {
  try {
    console.log("🔍 Listando TODAS as notificações para debug...");

    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Total de notificações no banco: ${notifications.length}`);

    // Log detalhado
    if (notifications.length > 0) {
      console.log("📋 Todas as notificações no banco:");
      notifications.forEach((notif, index) => {
        console.log(`  ${index + 1}. [${notif.type}] ${notif.title}`);
        console.log(`      Para: ${notif.user.email} (${notif.user.role})`);
        console.log(`      Status: ${notif.isRead ? "Lida" : "Não lida"}`);
        console.log(`      Criada: ${notif.createdAt}`);
        console.log(`      ---`);
      });
    }

    return NextResponse.json({
      total: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        user: {
          email: n.user.email,
          role: n.user.role,
        },
      })),
    });
  } catch (error) {
    console.error("❌ Erro ao listar notificações para debug:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
