import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, startTime, endTime, excludeReservationId } = body;

    if (!roomId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Dados obrigatórios não fornecidos" },
        { status: 400 }
      );
    }

    // Buscar reservas conflitantes (apenas ACTIVE e APPROVED)
    const conflictingReservations = await prisma.reservation.findMany({
      where: {
        roomId,
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        status: {
          in: ["ACTIVE", "APPROVED"], // Apenas reservas ativas ou aprovadas
        },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const hasConflict = conflictingReservations.length > 0;

    return NextResponse.json({
      hasConflict,
      conflictingReservations,
      conflictCount: conflictingReservations.length,
    });
  } catch (error) {
    console.error("Erro ao verificar conflitos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
