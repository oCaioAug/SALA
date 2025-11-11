import { NotificationType } from "@prisma/client";

// Função utilitária para criar notificações
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar notificação");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
}

// Funções específicas para diferentes tipos de notificações
export const notificationService = {
  // Notificação quando uma nova reserva é criada
  async reservationCreated(reservation: any) {
    const title = "Nova Solicitação de Reserva";
    const message = `Nova solicitação para ${reservation.room.name} em ${new Date(reservation.startTime).toLocaleDateString("pt-BR")}`;

    // Notificar todos os admins
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification(
        admin.id,
        "RESERVATION_CREATED",
        title,
        message,
        {
          reservationId: reservation.id,
          roomId: reservation.roomId,
          userId: reservation.userId,
        }
      );
    }
  },

  // Notificação quando uma reserva é aprovada
  async reservationApproved(reservation: any) {
    const title = "Reserva Aprovada";
    const message = `Sua reserva para ${reservation.room.name} foi aprovada!`;

    await createNotification(
      reservation.userId,
      "RESERVATION_APPROVED",
      title,
      message,
      {
        reservationId: reservation.id,
        roomId: reservation.roomId,
      }
    );
  },

  // Notificação quando uma reserva é rejeitada
  async reservationRejected(reservation: any) {
    const title = "Reserva Rejeitada";
    const message = `Sua reserva para ${reservation.room.name} foi rejeitada.`;

    await createNotification(
      reservation.userId,
      "RESERVATION_REJECTED",
      title,
      message,
      {
        reservationId: reservation.id,
        roomId: reservation.roomId,
      }
    );
  },

  // Notificação quando uma reserva é cancelada
  async reservationCancelled(reservation: any) {
    const title = "Reserva Cancelada";
    const message = `A reserva para ${reservation.room.name} foi cancelada.`;

    await createNotification(
      reservation.userId,
      "RESERVATION_CANCELLED",
      title,
      message,
      {
        reservationId: reservation.id,
        roomId: reservation.roomId,
      }
    );
  },

  // Notificação de conflito de horário
  async reservationConflict(reservation: any, conflictingReservation: any) {
    const title = "Conflito de Horário Detectado";
    const message = `Conflito detectado: ${reservation.room.name} já está reservada no mesmo horário.`;

    // Notificar o usuário que tentou fazer a reserva
    await createNotification(
      reservation.userId,
      "RESERVATION_CONFLICT",
      title,
      message,
      {
        reservationId: reservation.id,
        roomId: reservation.roomId,
        conflictingReservationId: conflictingReservation.id,
      }
    );

    // Notificar admins sobre o conflito
    const adminUsers = await getAdminUsers();

    for (const admin of adminUsers) {
      await createNotification(
        admin.id,
        "RESERVATION_CONFLICT",
        "Conflito de Horário Detectado",
        `Conflito detectado na sala ${reservation.room.name} entre usuários ${reservation.user.name} e ${conflictingReservation.user.name}`,
        {
          reservationId: reservation.id,
          conflictingReservationId: conflictingReservation.id,
          roomId: reservation.roomId,
        }
      );
    }
  },

  // Notificação quando o status de uma sala muda
  async roomStatusChanged(room: any, oldStatus: string, newStatus: string) {
    const title = "Status da Sala Alterado";
    const message = `O status da sala ${room.name} mudou de ${oldStatus} para ${newStatus}.`;

    // Notificar todos os usuários ativos
    const activeUsers = await getActiveUsers();

    for (const user of activeUsers) {
      await createNotification(user.id, "ROOM_STATUS_CHANGED", title, message, {
        roomId: room.id,
        oldStatus,
        newStatus,
      });
    }
  },

  // Notificação de anúncio do sistema
  async systemAnnouncement(
    title: string,
    message: string,
    targetUsers?: string[]
  ) {
    const users = targetUsers
      ? await getUsersByIds(targetUsers)
      : await getActiveUsers();

    for (const user of users) {
      await createNotification(user.id, "SYSTEM_ANNOUNCEMENT", title, message, {
        isSystemAnnouncement: true,
      });
    }
  },
};

// Funções auxiliares para buscar usuários
async function getAdminUsers() {
  try {
    const response = await fetch("/api/users?role=ADMIN");
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar usuários admin:", error);
    return [];
  }
}

async function getActiveUsers() {
  try {
    const response = await fetch("/api/users");
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar usuários ativos:", error);
    return [];
  }
}

async function getUsersByIds(userIds: string[]) {
  try {
    const response = await fetch("/api/users");
    if (response.ok) {
      const allUsers = await response.json();
      return allUsers.filter((user: any) => userIds.includes(user.id));
    }
    return [];
  } catch (error) {
    console.error("Erro ao buscar usuários por IDs:", error);
    return [];
  }
}
