import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const now = new Date();

    // Verificar se há uma reserva ativa NESTE MOMENTO
    const currentReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: "ACTIVE",
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: {
        user: true,
      },
    });

    // Se há uma reserva ativa agora, a sala está ocupada
    const isCurrentlyOccupied = !!currentReservation;

    // Buscar próximas reservas (independente se está ocupada agora)
    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        roomId,
        status: "ACTIVE",
        startTime: { gt: now },
      },
      include: {
        user: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5, // Próximas 5 reservas
    });

    return NextResponse.json({
      isCurrentlyOccupied,
      currentReservation,
      upcomingReservations,
      canMakeReservation: true, // Sempre pode tentar fazer reserva para outros horários
    });
  } catch (error) {
    console.error("Erro ao verificar status da sala:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
