import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Atualizar status para REJECTED
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "REJECTED",
        updatedAt: new Date(),
      },
      include: {
        user: true,
        room: true,
      },
    });

    // Criar notificação para o usuário sobre a rejeição
    try {
      await notificationService.reservationRejected(updatedReservation);
    } catch (notificationError) {
      console.error("Erro ao criar notificação de rejeição:", notificationError);
      // Não falhar a rejeição por causa da notificação
    }

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Erro ao rejeitar reserva:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
