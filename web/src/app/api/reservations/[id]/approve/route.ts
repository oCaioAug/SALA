import { NextRequest, NextResponse } from "next/server";

import { notificationService } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;

    if (!reservationId) {
      return NextResponse.json(
        { error: "ID da reserva não fornecido" },
        { status: 400 }
      );
    }

    // Buscar a reserva
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        user: true,
        room: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reserva não encontrada" },
        { status: 404 }
      );
    }

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Esta reserva já foi processada" },
        { status: 400 }
      );
    }

    // Atualizar status para APPROVED
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "APPROVED",
        updatedAt: new Date(),
      },
      include: {
        user: true,
        room: true,
      },
    });

    // Criar notificação para o usuário sobre a aprovação
    console.log(`🔔 Iniciando criação de notificação para aprovação da reserva ${reservationId}`);
    console.log(`👤 Usuário que receberá notificação: ${updatedReservation.user.email} (ID: ${updatedReservation.userId})`);
    
    try {
      await notificationService.reservationApproved(updatedReservation);
      console.log(`✅ Notificação de aprovação criada com sucesso para ${updatedReservation.user.email}`);
    } catch (notificationError) {
      console.error(
        "❌ Erro ao criar notificação de aprovação:",
        notificationError
      );
      // Não falhar a aprovação por causa da notificação
    }

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Erro ao aprovar reserva:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
