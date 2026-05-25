import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { getIntlLocale } from "@/lib/utils";

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
}

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
}

export class PushNotificationService {
  private readonly expoUrl = "https://exp.host/--/api/v2/push/send";

  /**
   * Envia notificação push para um usuário específico
   */
  async sendToUser(
    userId: string,
    payload: Omit<PushNotificationPayload, "to">
  ): Promise<boolean> {
    try {
      console.log(` Buscando push tokens para usuário: ${userId}`);

      // Buscar tokens ativos do usuário
      const pushTokens = await prisma.pushToken.findMany({
        where: {
          userId: userId,
          isActive: true,
        },
        select: {
          token: true,
        },
      });

      console.log(` Tokens encontrados: ${pushTokens.length}`);
      pushTokens.forEach((token, index) => {
        console.log(`Token ${index + 1}: ${token.token.substring(0, 20)}...`);
      });

      if (pushTokens.length === 0) {
        console.log(
          ` Nenhum token push ativo encontrado para o usuário ${userId}`
        );
        return false;
      }

      const tokens = pushTokens.map(pt => pt.token);
      console.log(` Enviando push para ${tokens.length} tokens...`);

      const result = await this.sendToTokens(tokens, payload);
      console.log(` Resultado do envio: ${result}`);

      return result;
    } catch (error) {
      console.error("Erro ao enviar notificação push para usuário:", error);
      return false;
    }
  }

  /**
   * Envia notificação push para múltiplos tokens
   */
  async sendToTokens(
    tokens: string[],
    payload: Omit<PushNotificationPayload, "to">
  ): Promise<boolean> {
    try {
      console.log(` Preparando ${tokens.length} mensagens push...`);

      const messages: ExpoPushMessage[] = tokens.map(token => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: payload.sound || "default",
        badge: payload.badge,
      }));

      console.log(` Mensagens preparadas:`, {
        count: messages.length,
        title: payload.title,
        body: payload.body,
        firstToken: messages[0]?.to?.substring(0, 20) + "...",
      });

      console.log(` Enviando para Expo: ${this.expoUrl}`);

      const response = await fetch(this.expoUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      console.log(` Resposta HTTP: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta do Expo:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        return false;
      }

      const result = await response.json();
      console.log(
        "Resultado completo do Expo:",
        JSON.stringify(result, null, 2)
      );

      // Verificar se há tokens inválidos e desativá-los
      if (result.data) {
        let invalidTokensCount = 0;
        for (let i = 0; i < result.data.length; i++) {
          const receipt = result.data[i];
          console.log(` Receipt ${i + 1}:`, receipt);

          if (receipt.status === "error") {
            const invalidToken = tokens[i];
            console.error(
              ` Token inválido: ${invalidToken?.substring(0, 20)}... - Erro: ${receipt.details?.error}`
            );

            if (receipt.details?.error === "DeviceNotRegistered") {
              await this.deactivateToken(invalidToken);
              invalidTokensCount++;
              console.log(
                ` Token desativado: ${invalidToken?.substring(0, 20)}...`
              );
            }
          } else {
            console.log(` Push enviado com sucesso para token ${i + 1}`);
          }
        }

        if (invalidTokensCount > 0) {
          console.log(
            ` ${invalidTokensCount} tokens inválidos foram desativados`
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao enviar notificações push:", error);
      return false;
    }
  }

  /**
   * Desativa um token push
   */
  async deactivateToken(token: string): Promise<void> {
    try {
      await prisma.pushToken.updateMany({
        where: { token },
        data: { isActive: false },
      });
    } catch (error) {
      console.error("Erro ao desativar token:", error);
    }
  }

  /**
   * Envia notificação de aprovação de reserva
   */
  async sendReservationApprovalNotification(
    userId: string,
    reservationData: {
      roomName: string;
      startTime: Date;
      endTime: Date;
    },
    locale: string = "pt"
  ): Promise<boolean> {
    const t = await getTranslations({
      locale,
      namespace: "NotificationService",
    });
    const intlLocale = getIntlLocale(locale);
    const startTimeFormatted = reservationData.startTime.toLocaleString(
      intlLocale,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    return await this.sendToUser(userId, {
      title: t("titles.reservationApproved"),
      body: t("messages.reservationApproved", {
        roomName: reservationData.roomName,
        startTime: startTimeFormatted,
      }),
      data: {
        type: "RESERVATION_APPROVED",
        reservationId: reservationData,
      },
      badge: 1,
    });
  }

  /**
   * Envia notificação de rejeição de reserva
   */
  async sendReservationRejectionNotification(
    userId: string,
    reservationData: {
      roomName: string;
      startTime: Date;
      reason?: string;
    },
    locale: string = "pt"
  ): Promise<boolean> {
    const t = await getTranslations({
      locale,
      namespace: "NotificationService",
    });
    const intlLocale = getIntlLocale(locale);
    const startTimeFormatted = reservationData.startTime.toLocaleString(
      intlLocale,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
    const reasonText = reservationData.reason
      ? t("messages.reasonPrefix", { reason: reservationData.reason })
      : "";

    return await this.sendToUser(userId, {
      title: t("titles.reservationRejected"),
      body: t("messages.reservationRejected", {
        roomName: reservationData.roomName,
        startTime: startTimeFormatted,
        reason: reasonText,
      }),
      data: {
        type: "RESERVATION_REJECTED",
        reservationId: reservationData,
      },
      badge: 1,
    });
  }

  /**
   * Envia notificação geral do sistema
   */
  async sendSystemNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    return await this.sendToUser(userId, {
      title,
      body,
      data: {
        type: "SYSTEM_NOTIFICATION",
        ...data,
      },
      badge: 1,
    });
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
