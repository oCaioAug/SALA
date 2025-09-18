import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: true,
        room: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Erro ao buscar reservas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, roomId, startTime, endTime, purpose } = body;

    console.log("Dados recebidos para criar reserva:", {
      userId,
      roomId,
      startTime,
      endTime,
      purpose,
    });

    if (!userId || !roomId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      console.log("Usuário não encontrado:", userId);
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    console.log("Usuário encontrado:", userExists);

    // Verificar se a sala está disponível no horário
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: "ACTIVE",
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
        ],
      },
    });

    if (conflictingReservation) {
      return NextResponse.json(
        { error: "A sala já está reservada neste horário" },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose,
      },
      include: {
        user: true,
        room: true,
      },
    });

    // Atualizar status da sala para RESERVADO
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "RESERVADO" },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
