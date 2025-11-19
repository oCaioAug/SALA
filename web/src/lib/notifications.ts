import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Função utilitária para criar notificações diretamente no banco
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
      },
      include: {
        user: true,
      },
    });

    console.log(
      `✅ Notificação criada para ${notification.user.email}: ${title}`
    );
    return notification;
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
    throw error;
  }
}

// Funções específicas para diferentes tipos de notificações
export const notificationService = {
  // Notificação quando uma nova reserva é criada
  async reservationCreated(reservation: any) {
    try {
      const title = "Nova Solicitação de Reserva";
      const startDate = new Date(reservation.startTime);
      const startTime = startDate.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const userIsAdmin = reservation.user.role === "ADMIN";

      let message: string;
      if (userIsAdmin) {
        message = `${reservation.user.name || "Usuário"} reservou a sala "${reservation.room.name}" para ${startTime}. ${reservation.purpose ? `Finalidade: ${reservation.purpose}` : ""}`;
      } else {
        message = `${reservation.user.name || "Usuário"} solicitou reserva da sala "${reservation.room.name}" para ${startTime}. ${reservation.purpose ? `Finalidade: ${reservation.purpose}` : ""}`;
      }

      // Buscar todos os usuários administradores
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true },
      });

      console.log(
        `🔔 Criando notificações para ${adminUsers.length} administradores`
      );

      // Criar notificação para cada admin
      const notifications = await Promise.all(
        adminUsers.map(admin =>
          createNotification(admin.id, "RESERVATION_CREATED", title, message, {
            reservationId: reservation.id,
            roomId: reservation.roomId,
            roomName: reservation.room.name,
            userId: reservation.userId,
            userName: reservation.user.name,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            purpose: reservation.purpose,
          })
        )
      );

      console.log(
        `✅ ${notifications.length} notificações criadas com sucesso`
      );
      return notifications;
    } catch (error) {
      console.error("Erro ao criar notificações para admins:", error);
      throw error;
    }
  },

  // Notificação quando uma reserva é aprovada
  async reservationApproved(reservation: any) {
    try {
      console.log(`🔔 Criando notificação de aprovação para reserva ${reservation.id}`);
      console.log(`👤 Usuário: ${reservation.user.email} (ID: ${reservation.userId})`);
      console.log(`🏢 Sala: ${reservation.room.name}`);
      
      const title = "Reserva Aprovada ✅";
      const startTime = new Date(reservation.startTime).toLocaleString(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      const message = `Sua reserva da sala "${reservation.room.name}" foi aprovada! Data: ${startTime}`;

      console.log(`📝 Dados da notificação: ${title} - ${message}`);

      const notification = await createNotification(
        reservation.userId,
        "RESERVATION_APPROVED",
        title,
        message,
        {
          reservationId: reservation.id,
          roomId: reservation.roomId,
          roomName: reservation.room.name,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
        }
      );
      
      console.log(`✅ Notificação criada com sucesso: ID ${notification.id}`);
      return notification;
    } catch (error) {
      console.error("❌ Erro ao notificar aprovação de reserva:", error);
      throw error;
    }
  },

  // Notificação quando uma reserva é rejeitada
  async reservationRejected(reservation: any, reason?: string) {
    try {
      const title = "Reserva Rejeitada ❌";
      const startTime = new Date(reservation.startTime).toLocaleString(
        "pt-BR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      let message = `Sua reserva da sala "${reservation.room.name}" para ${startTime} foi rejeitada.`;
      if (reason) {
        message += ` Motivo: ${reason}`;
      }

      await createNotification(
        reservation.userId,
        "RESERVATION_REJECTED",
        title,
        message,
        {
          reservationId: reservation.id,
          roomId: reservation.roomId,
          roomName: reservation.room.name,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          reason: reason || null,
        }
      );
    } catch (error) {
      console.error("Erro ao notificar rejeição de reserva:", error);
      throw error;
    }
  },

  // Notificação quando uma reserva é cancelada
  async reservationCancelled(reservation: any) {
    try {
      const title = "Reserva Cancelada";
      const message = `A reserva da sala "${reservation.room.name}" foi cancelada.`;

      await createNotification(
        reservation.userId,
        "RESERVATION_CANCELLED",
        title,
        message,
        {
          reservationId: reservation.id,
          roomId: reservation.roomId,
          roomName: reservation.room.name,
        }
      );
    } catch (error) {
      console.error("Erro ao notificar cancelamento de reserva:", error);
      throw error;
    }
  },

  // Notificação de anúncio do sistema
  async systemAnnouncement(
    title: string,
    message: string,
    targetUserIds?: string[]
  ) {
    try {
      let users;

      if (targetUserIds && targetUserIds.length > 0) {
        users = await prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, email: true, name: true },
        });
      } else {
        users = await prisma.user.findMany({
          select: { id: true, email: true, name: true },
        });
      }

      const notifications = await Promise.all(
        users.map(user =>
          createNotification(user.id, "SYSTEM_ANNOUNCEMENT", title, message, {
            isSystemAnnouncement: true,
          })
        )
      );

      console.log(
        `✅ Anúncio do sistema enviado para ${notifications.length} usuários`
      );
      return notifications;
    } catch (error) {
      console.error("Erro ao enviar anúncio do sistema:", error);
      throw error;
    }
  },
};
