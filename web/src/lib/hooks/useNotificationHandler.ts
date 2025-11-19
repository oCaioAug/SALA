import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface NotificationData {
  reservationId?: string;
  roomId?: string;
  roomName?: string;
  userId?: string;
  userName?: string;
  startTime?: string;
  endTime?: string;
  purpose?: string;
}

interface NotificationClickData {
  id: string;
  type: string;
  data?: NotificationData | string | any;
}

export const useNotificationHandler = () => {
  const router = useRouter();

  const handleNotificationClick = useCallback(
    (notification: NotificationClickData) => {
      // Se for uma notificação de reserva criada
      if (notification.type === "RESERVATION_CREATED") {
        let notificationData: NotificationData = {};

        try {
          // Tentar parsear se for string
          if (typeof notification.data === "string") {
            notificationData = JSON.parse(notification.data);
          } else if (notification.data) {
            notificationData = notification.data;
          }
        } catch (error) {
          console.error("Erro ao parsear dados da notificação:", error);
        }

        const reservationId = notificationData?.reservationId;
        if (reservationId) {
          // Navegar para solicitações com foco na reserva específica
          router.push(`/solicitacoes?focusReservation=${reservationId}`);
        } else {
          // Se não tem ID específico, ir para solicitações
          router.push("/solicitacoes");
        }
        return;
      }

      // Se for notificação de reserva aprovada/rejeitada, ir para agendamentos
      if (
        notification.type === "RESERVATION_APPROVED" ||
        notification.type === "RESERVATION_REJECTED" ||
        notification.type === "RESERVATION_CANCELLED"
      ) {
        router.push("/agendamentos");
        return;
      }

      // Para outros tipos de notificação, manter na página de notificações
      router.push("/notificacoes");
    },
    [router]
  );

  return { handleNotificationClick };
};
