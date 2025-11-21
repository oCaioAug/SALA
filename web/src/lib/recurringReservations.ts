import { prisma } from "@/lib/prisma";

export type RecurringPattern = "DAILY" | "WEEKLY" | "MONTHLY";

interface RecurringReservationData {
  userId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  purpose?: string;
  recurringPattern: RecurringPattern;
  recurringDaysOfWeek: number[]; // 0=domingo, 1=segunda, ..., 6=sábado
  recurringEndDate: Date;
  status: "PENDING" | "APPROVED";
  recurringTemplateId: string;
}

/**
 * Gera todas as reservas recorrentes baseadas no padrão especificado
 */
export async function generateRecurringReservations(
  data: RecurringReservationData
): Promise<string[]> {
  const {
    userId,
    roomId,
    startTime,
    endTime,
    purpose,
    recurringPattern,
    recurringDaysOfWeek,
    recurringEndDate,
    status,
    recurringTemplateId,
  } = data;

  const reservations: Array<{
    userId: string;
    roomId: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
    status: "PENDING" | "APPROVED";
    isRecurring: boolean;
    recurringPattern: RecurringPattern;
    recurringDaysOfWeek: number[];
    recurringEndDate: Date;
    parentReservationId: string | null;
    recurringTemplateId: string;
  }> = [];

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const duration = endDate.getTime() - startDate.getTime(); // Duração em ms

  // Obter horário base (hora e minuto)
  const baseHour = startDate.getHours();
  const baseMinute = startDate.getMinutes();
  const baseSecond = startDate.getSeconds();

  let currentDate = new Date(startDate);

  // Gerar reservas até a data final
  while (currentDate <= recurringEndDate) {
    let shouldInclude = false;

    if (recurringPattern === "WEEKLY") {
      // Para WEEKLY, verificar se este dia da semana está no padrão
      const dayOfWeek = currentDate.getDay(); // 0=domingo, 6=sábado
      shouldInclude = recurringDaysOfWeek.includes(dayOfWeek);
    } else if (recurringPattern === "DAILY") {
      // Para DAILY, incluir todos os dias
      shouldInclude = true;
    } else if (recurringPattern === "MONTHLY") {
      // Para MONTHLY, incluir apenas se for o mesmo dia do mês
      shouldInclude = currentDate.getDate() === startDate.getDate();
    }

    if (shouldInclude) {
      // Criar data/hora para esta ocorrência
      const occurrenceStart = new Date(currentDate);
      occurrenceStart.setHours(baseHour, baseMinute, baseSecond, 0);

      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

      // Verificar se não passou da data final
      if (occurrenceStart <= recurringEndDate) {
        reservations.push({
          userId,
          roomId,
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
          purpose,
          status,
          isRecurring: true,
          recurringPattern,
          recurringDaysOfWeek,
          recurringEndDate,
          parentReservationId: null, // Será atualizado após criar a primeira reserva
          recurringTemplateId,
        });
      }
    }

    // Avançar para o próximo dia/semana/mês
    switch (recurringPattern) {
      case "DAILY":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "WEEKLY":
        // Para WEEKLY, avançar dia a dia para pegar todos os dias da semana selecionados
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "MONTHLY":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  // Criar todas as reservas no banco uma por uma para obter os IDs
  const createdReservationIds: string[] = [];
  let parentId: string | null = null;

  for (const reservationData of reservations) {
    const created = await prisma.reservation.create({
      data: {
        ...reservationData,
        parentReservationId: parentId, // Primeira será null, as outras apontam para a primeira
      },
    });

    createdReservationIds.push(created.id);

    // A primeira reserva criada é a "pai"
    if (!parentId) {
      parentId = created.id;
    }
  }

  // Atualizar todas as reservas filhas para apontar para a reserva pai
  if (parentId && createdReservationIds.length > 1) {
    await prisma.reservation.updateMany({
      where: {
        recurringTemplateId,
        id: {
          not: parentId,
        },
      },
      data: {
        parentReservationId: parentId,
      },
    });
  }

  return createdReservationIds;
}

/**
 * Gera as datas de todas as ocorrências recorrentes sem criar no banco
 */
export function generateRecurringDates(
  startTime: Date,
  endTime: Date,
  recurringPattern: RecurringPattern,
  recurringDaysOfWeek: number[],
  recurringEndDate: Date
): Array<{ startTime: Date; endTime: Date }> {
  const occurrences: Array<{ startTime: Date; endTime: Date }> = [];
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const duration = endDate.getTime() - startDate.getTime();

  const baseHour = startDate.getHours();
  const baseMinute = startDate.getMinutes();
  const baseSecond = startDate.getSeconds();

  let currentDate = new Date(startDate);

  while (currentDate <= recurringEndDate) {
    let shouldInclude = false;

    if (recurringPattern === "WEEKLY") {
      // Para WEEKLY, verificar se este dia da semana está no padrão
      const dayOfWeek = currentDate.getDay();
      shouldInclude = recurringDaysOfWeek.includes(dayOfWeek);
    } else if (recurringPattern === "DAILY") {
      // Para DAILY, incluir todos os dias
      shouldInclude = true;
    } else if (recurringPattern === "MONTHLY") {
      // Para MONTHLY, incluir apenas se for o mesmo dia do mês
      shouldInclude = currentDate.getDate() === startDate.getDate();
    }

    if (shouldInclude) {
      const occurrenceStart = new Date(currentDate);
      occurrenceStart.setHours(baseHour, baseMinute, baseSecond, 0);
      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

      if (occurrenceStart <= recurringEndDate) {
        occurrences.push({
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
        });
      }
    }

    switch (recurringPattern) {
      case "DAILY":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "WEEKLY":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "MONTHLY":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return occurrences;
}

/**
 * Verifica se há conflitos para todas as reservas recorrentes
 */
export async function checkRecurringConflicts(
  roomId: string,
  reservations: Array<{ startTime: Date; endTime: Date }>
): Promise<Array<{ startTime: Date; endTime: Date; conflict: any }>> {
  const conflicts: Array<{ startTime: Date; endTime: Date; conflict: any }> = [];

  for (const reservation of reservations) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: {
          in: ["ACTIVE", "APPROVED", "PENDING"],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: reservation.startTime } },
              { endTime: { gt: reservation.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: reservation.endTime } },
              { endTime: { gte: reservation.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: reservation.startTime } },
              { endTime: { lte: reservation.endTime } },
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

    if (conflict) {
      console.log(`⚠️ Conflito detectado:`, {
        tentativa: {
          start: reservation.startTime.toISOString(),
          end: reservation.endTime.toISOString(),
        },
        conflito: {
          id: conflict.id,
          start: conflict.startTime.toISOString(),
          end: conflict.endTime.toISOString(),
          status: conflict.status,
          user: conflict.user.name,
        },
      });
      conflicts.push({
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        conflict,
      });
    }
  }

  return conflicts;
}

