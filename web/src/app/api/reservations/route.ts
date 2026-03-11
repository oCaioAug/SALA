import { NextRequest, NextResponse } from "next/server";

import { notificationService } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  checkRecurringConflicts,
  generateRecurringDates,
  generateRecurringReservations,
} from "@/lib/recurringReservations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    console.log(" ---> mostrando requisicao de reservas: ", request);

    console.log("🔍 Buscando reservas com filtros:", {
      roomId,
      status,
      userId,
    });

    const where: any = {};

    if (roomId) {
      where.roomId = roomId;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    console.log("📋 Query where:", where);

    // Se não há filtro de status específico, mostrar apenas reservas ativas/aprovadas
    // if (!status) {
    //   where.status = {
    //     in: ["APPROVED", "ACTIVE"],
    //   };
    // }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: true,
        room: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    console.log(`✅ Encontradas ${reservations.length} reservas`);

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("❌ Erro ao buscar reservas:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      roomId,
      startTime,
      endTime,
      purpose,
      isRecurring,
      recurringPattern,
      recurringEndDate,
    } = body;
    let { recurringDaysOfWeek } = body;

    console.log("Dados recebidos para criar reserva:", {
      userId,
      roomId,
      startTime,
      endTime,
      purpose,
      isRecurring,
      recurringPattern,
      recurringDaysOfWeek,
      recurringEndDate,
    });

    if (!userId || !roomId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Todos os campos obrigatórios devem ser preenchidos" },
        { status: 400 }
      );
    }

    // Validação para reservas recorrentes
    if (isRecurring) {
      if (!recurringPattern || !recurringEndDate) {
        return NextResponse.json(
          {
            error:
              "Para reservas recorrentes, é necessário informar: padrão de recorrência e data final",
          },
          { status: 400 }
        );
      }

      if (!["DAILY", "WEEKLY", "MONTHLY"].includes(recurringPattern)) {
        return NextResponse.json(
          { error: "Padrão de recorrência inválido" },
          { status: 400 }
        );
      }

      // Para padrão WEEKLY, é necessário selecionar pelo menos um dia da semana
      if (recurringPattern === "WEEKLY") {
        if (
          !Array.isArray(recurringDaysOfWeek) ||
          recurringDaysOfWeek.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "Para padrão semanal, é necessário selecionar pelo menos um dia da semana",
            },
            { status: 400 }
          );
        }
      }

      // Para DAILY e MONTHLY, usar o dia da semana da data inicial se não fornecido
      if (
        recurringPattern !== "WEEKLY" &&
        (!recurringDaysOfWeek || recurringDaysOfWeek.length === 0)
      ) {
        const startDate = new Date(startTime);
        const dayOfWeek = startDate.getDay();
        recurringDaysOfWeek = [dayOfWeek];
      }

      const endDate = new Date(recurringEndDate);
      const startDate = new Date(startTime);
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: "A data final deve ser posterior à data inicial" },
          { status: 400 }
        );
      }
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
    // Verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Sala não encontrada" },
        { status: 404 }
      );
    }

    // Se for reserva recorrente, verificar conflitos para todas as ocorrências
    if (isRecurring) {
      // Gerar todas as datas de ocorrências sem criar no banco
      const recurringDates = generateRecurringDates(
        new Date(startTime),
        new Date(endTime),
        recurringPattern,
        recurringDaysOfWeek,
        new Date(recurringEndDate)
      );

      console.log(
        `🔍 Verificando conflitos para ${recurringDates.length} ocorrências recorrentes`
      );

      // Verificar conflitos para cada ocorrência
      const conflicts = await checkRecurringConflicts(roomId, recurringDates);

      if (conflicts.length > 0) {
        console.log(`⚠️ Encontrados ${conflicts.length} conflitos`);
        const firstConflict = conflicts[0];
        const conflictStart = new Date(firstConflict.startTime).toLocaleString(
          "pt-BR"
        );
        const conflictEnd = new Date(firstConflict.endTime).toLocaleString(
          "pt-BR"
        );

        // Buscar informações da reserva conflitante
        const conflictingReservation = await prisma.reservation.findFirst({
          where: {
            roomId,
            status: {
              in: ["ACTIVE", "APPROVED", "PENDING"],
            },
            OR: [
              {
                AND: [
                  { startTime: { lte: firstConflict.startTime } },
                  { endTime: { gt: firstConflict.startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: firstConflict.endTime } },
                  { endTime: { gte: firstConflict.endTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: firstConflict.startTime } },
                  { endTime: { lte: firstConflict.endTime } },
                ],
              },
            ],
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        const conflictDetails = conflictingReservation
          ? {
              id: conflictingReservation.id,
              startTime: conflictingReservation.startTime,
              endTime: conflictingReservation.endTime,
              status: conflictingReservation.status,
              user: conflictingReservation.user.name,
              userEmail: conflictingReservation.user.email,
            }
          : null;

        return NextResponse.json(
          {
            error: `A sala já está reservada em alguns horários da recorrência. Primeiro conflito: ${conflictStart} - ${conflictEnd}${conflictDetails ? ` (Reservado por: ${conflictDetails.user} - Status: ${conflictDetails.status})` : ""}`,
            conflicts: conflicts.map(c => ({
              startTime: c.startTime,
              endTime: c.endTime,
            })),
            conflictingReservation: conflictDetails,
            conflictCount: conflicts.length,
          },
          { status: 409 }
        );
      }
    } else {
      // Verificar se a sala está disponível no horário (reserva única)
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          roomId,
          status: { in: ["ACTIVE", "APPROVED", "PENDING"] },
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
      });

      if (conflictingReservation) {
        const conflictStart = new Date(
          conflictingReservation.startTime
        ).toLocaleString("pt-BR");
        const conflictEnd = new Date(
          conflictingReservation.endTime
        ).toLocaleString("pt-BR");

        return NextResponse.json(
          {
            error: `A sala já está reservada neste horário. Conflito: ${conflictStart} - ${conflictEnd}`,
            conflictingReservation: {
              id: conflictingReservation.id,
              startTime: conflictingReservation.startTime,
              endTime: conflictingReservation.endTime,
              user: conflictingReservation.userId,
            },
          },
          { status: 409 }
        );
      }
    }

    const userIsAdmin = userExists.role === "ADMIN";
    const status = userIsAdmin ? "APPROVED" : "PENDING";

    // Se for reserva recorrente, gerar todas as ocorrências
    if (isRecurring) {
      const recurringTemplateId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Gerar todas as reservas recorrentes
      const reservationIds = await generateRecurringReservations({
        userId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose,
        recurringPattern,
        recurringDaysOfWeek,
        recurringEndDate: new Date(recurringEndDate),
        status,
        recurringTemplateId,
      });

      // Buscar todas as reservas criadas para retornar
      const allCreatedReservations = await prisma.reservation.findMany({
        where: {
          id: { in: reservationIds },
        },
        include: {
          user: true,
          room: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });

      if (allCreatedReservations.length === 0) {
        return NextResponse.json(
          { error: "Erro ao criar reservas recorrentes" },
          { status: 500 }
        );
      }

      // A primeira reserva é a "pai"
      const parentReservation = allCreatedReservations[0];

      // Criar notificação para admins sobre nova reserva recorrente
      try {
        await notificationService.reservationCreated(parentReservation);
      } catch (notificationError) {
        console.error("Erro ao criar notificação:", notificationError);
        // Não falhar a criação da reserva por causa da notificação
      }

      // Retornar todas as reservas criadas
      return NextResponse.json(
        {
          reservations: allCreatedReservations,
          isRecurring: true,
          recurringInstances: allCreatedReservations.length,
          parentReservation: parentReservation,
        },
        { status: 201 }
      );
    }

    // Criar reserva única (não recorrente)
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose,
        status,
        isRecurring: false,
      },
      include: {
        user: true,
        room: true,
      },
    });

    // Criar notificação para admins sobre nova reserva
    try {
      await notificationService.reservationCreated(reservation);
    } catch (notificationError) {
      console.error("Erro ao criar notificação:", notificationError);
      // Não falhar a criação da reserva por causa da notificação
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);

    // Verificar se é um erro de validação do Prisma
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Já existe uma reserva com estes dados" },
          { status: 409 }
        );
      }

      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Usuário ou sala inválidos" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
