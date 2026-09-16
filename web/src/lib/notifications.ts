import { NotificationType, OrganizationRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";

import { isOrgAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getIntlLocale } from "@/lib/utils";

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
      ` Notificação criada para ${notification.user.email}: ${title}`
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
  async reservationCreated(reservation: any, locale: string = "pt") {
    try {
      const t = await getTranslations({
        locale,
        namespace: "NotificationService",
      });

      const title = t("titles.reservationCreated");
      const startDate = new Date(reservation.startTime);

      // Converter locale para formato do Intl
      const intlLocale = getIntlLocale(locale);
      const startTime = startDate.toLocaleString(intlLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const organizationId =
        reservation.organizationId ?? reservation.room?.organizationId;

      let userIsAdmin = false;
      if (organizationId) {
        const creatorMembership = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId,
              userId: reservation.userId,
            },
          },
          select: { role: true },
        });
        userIsAdmin = isOrgAdminRole(creatorMembership?.role);
      }
      const userName =
        reservation.user.name || (locale === "pt" ? "Usuário" : "User");
      const purposeText = reservation.purpose
        ? t("messages.purposePrefix", { purpose: reservation.purpose })
        : "";

      let message: string;
      if (userIsAdmin) {
        message = t("messages.reservationCreatedAdmin", {
          userName,
          roomName: reservation.room.name,
          startTime,
          purpose: purposeText,
        });
      } else {
        message = t("messages.reservationCreatedUser", {
          userName,
          roomName: reservation.room.name,
          startTime,
          purpose: purposeText,
        });
      }

      const adminMembers = organizationId
        ? await prisma.organizationMember.findMany({
            where: {
              organizationId,
              role: {
                in: [OrganizationRole.OWNER, OrganizationRole.ADMIN],
              },
            },
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          })
        : [];

      const sectorId =
        reservation.room?.sectorId ??
        (
          await prisma.room.findUnique({
            where: { id: reservation.roomId },
            select: { sectorId: true },
          })
        )?.sectorId;

      const sectorManagers = sectorId
        ? await prisma.sectorMember.findMany({
            where: {
              sectorId,
              role: "MANAGER",
              canApproveReservations: true,
            },
            include: {
              user: { select: { id: true, email: true, name: true } },
            },
          })
        : [];

      const recipientMap = new Map<
        string,
        { id: string; email: string | null; name: string | null }
      >();
      for (const member of adminMembers) {
        recipientMap.set(member.user.id, member.user);
      }
      for (const member of sectorManagers) {
        recipientMap.set(member.user.id, member.user);
      }
      const recipients = Array.from(recipientMap.values());

      console.log(
        ` Criando notificações para ${recipients.length} aprovadores`
      );

      const notifications = await Promise.all(
        recipients.map(recipient =>
          createNotification(
            recipient.id,
            "RESERVATION_CREATED",
            title,
            message,
            {
              reservationId: reservation.id,
              roomId: reservation.roomId,
              roomName: reservation.room.name,
              userId: reservation.userId,
              userName: reservation.user.name,
              isAdmin: userIsAdmin,
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              purpose: reservation.purpose,
            }
          )
        )
      );

      console.log(` ${notifications.length} notificações criadas com sucesso`);
      return notifications;
    } catch (error) {
      console.error("Erro ao criar notificações para admins:", error);
      throw error;
    }
  },

  // Notificação quando uma reserva é aprovada
  async reservationApproved(reservation: any, locale: string = "pt") {
    try {
      console.log(
        ` Criando notificação de aprovação para reserva ${reservation.id}`
      );
      console.log(
        ` Usuário: ${reservation.user.email} (ID: ${reservation.userId})`
      );
      console.log(` Sala: ${reservation.room.name}`);

      const t = await getTranslations({
        locale,
        namespace: "NotificationService",
      });

      const title = t("titles.reservationApproved");

      // Converter locale para formato do Intl
      const intlLocale = getIntlLocale(locale);
      const startTime = new Date(reservation.startTime).toLocaleString(
        intlLocale,
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      const message = t("messages.reservationApproved", {
        roomName: reservation.room.name,
        startTime,
      });

      console.log(` Dados da notificação: ${title} - ${message}`);

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

      console.log(` Notificação criada com sucesso: ID ${notification.id}`);
      return notification;
    } catch (error) {
      console.error("Erro ao notificar aprovação de reserva:", error);
      throw error;
    }
  },

  // Notificação quando uma reserva é rejeitada
  async reservationRejected(
    reservation: any,
    reason?: string,
    locale: string = "pt"
  ) {
    try {
      const t = await getTranslations({
        locale,
        namespace: "NotificationService",
      });

      const title = t("titles.reservationRejected");

      // Converter locale para formato do Intl
      const intlLocale = getIntlLocale(locale);
      const startTime = new Date(reservation.startTime).toLocaleString(
        intlLocale,
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      const reasonText = reason ? t("messages.reasonPrefix", { reason }) : "";

      const message = t("messages.reservationRejected", {
        roomName: reservation.room.name,
        startTime,
        reason: reasonText,
      });

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
  async reservationCancelled(reservation: any, locale: string = "pt") {
    try {
      const t = await getTranslations({
        locale,
        namespace: "NotificationService",
      });

      const title = t("titles.reservationCancelled");
      const message = t("messages.reservationCancelled", {
        roomName: reservation.room.name,
      });

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
        ` Anúncio do sistema enviado para ${notifications.length} usuários`
      );
      return notifications;
    } catch (error) {
      console.error("Erro ao enviar anúncio do sistema:", error);
      throw error;
    }
  },
};
