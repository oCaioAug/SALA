import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/notifications";

// POST /api/notifications/test-reservation - Testar notificação de nova reserva
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testando notificação de nova reserva para administradores");

    // Buscar um usuário comum e uma sala para criar reserva fictícia
    const user = await prisma.user.findFirst({
      where: { role: "USER" },
    });

    const room = await prisma.room.findFirst();

    if (!user || !room) {
      return NextResponse.json(
        { error: "Usuário ou sala não encontrados para teste" },
        { status: 404 }
      );
    }

    // Criar dados fictícios de uma reserva
    const mockReservation = {
      id: "test-reservation-id",
      userId: user.id,
      roomId: room.id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Amanhã + 1 hora
      purpose: "Reunião de teste para demonstrar notificações",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
      },
    };

    // Chamar o serviço de notificações
    const notifications =
      await notificationService.reservationCreated(mockReservation);

    console.log(
      `✅ ${notifications.length} notificações de teste criadas para administradores`
    );

    return NextResponse.json({
      success: true,
      message: `${notifications.length} notificações criadas com sucesso!`,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        userEmail: n.user.email,
      })),
      mockReservation: {
        user: mockReservation.user.name,
        room: mockReservation.room.name,
        startTime: mockReservation.startTime.toLocaleString("pt-BR"),
        purpose: mockReservation.purpose,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao testar notificação de reserva:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
