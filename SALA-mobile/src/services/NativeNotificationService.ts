import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Vibration } from "react-native";
import {
  INotificationService,
  NotificationData,
  NOTIFICATION_CONFIGS,
  NotificationType,
} from "../types/notifications";
import AuthService from "../../services/AuthService";

/**
 * Service responsável por gerenciar notificações nativas do dispositivo
 * Implementa os princípios SOLID: SRP, OCP, LSP, DIP
 */
export class NativeNotificationService implements INotificationService {
  private static instance: NativeNotificationService;
  private expoPushToken: string | null = null;

  private constructor() {
    this.initializeNotifications();
  }

  public static getInstance(): NativeNotificationService {
    if (!NativeNotificationService.instance) {
      NativeNotificationService.instance = new NativeNotificationService();
    }
    return NativeNotificationService.instance;
  }

  /**
   * Inicializar configurações de notificação
   */
  private initializeNotifications(): void {
    // Configurar como as notificações devem ser exibidas
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const notificationType = notification.request.content.data?.type as
          | NotificationType
          | undefined;
        const config = notificationType
          ? NOTIFICATION_CONFIGS[notificationType]
          : undefined;

        return {
          shouldPlaySound: config?.sound ?? true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    console.log("📱 Serviço de notificações nativas inicializado");
  }

  /**
   * Solicitar permissões de notificação
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Verificar se é um dispositivo físico
      if (!Device.isDevice) {
        console.warn("⚠️ Notificações push não funcionam em simulador");
        return false;
      }

      // Solicitar permissões
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("⚠️ Permissões de notificação negadas");
        return false;
      }

      // Tentar obter push token (opcional - não falha se não conseguir)
      try {
        await this.getExpoPushToken();
      } catch (error) {
        // Push token é opcional - notificações locais funcionam sem ele
        console.log("ℹ️  Push token não disponível (opcional)");
      }

      console.log("✅ Permissões de notificação concedidas");
      return true;
    } catch (error) {
      console.error("❌ Erro ao solicitar permissões:", error);
      return false;
    }
  }

  /**
   * Agendar notificação push local
   */
  async schedulePushNotification(
    notification: NotificationData
  ): Promise<string | null> {
    try {
      const config = NOTIFICATION_CONFIGS[notification.type];

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            type: notification.type,
            notificationId: notification.id,
          },
          sound: config.sound ? "default" : undefined,
          badge: 1,
        },
        trigger: null, // Mostrar imediatamente
      });

      console.log(`📱 Notificação agendada: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error("❌ Erro ao agendar notificação:", error);
      return null;
    }
  }

  /**
   * Agendar notificação para um tempo específico (lembretes)
   */
  async scheduleTimedNotification(
    notification: NotificationData,
    triggerDate: Date
  ): Promise<string | null> {
    try {
      // Verificar permissões primeiro
      const hasPermissions = await this.areNotificationsEnabled();
      if (!hasPermissions) {
        console.error("❌ Permissões de notificação não concedidas!");
        return null;
      }

      const config = NOTIFICATION_CONFIGS[notification.type];
      const now = Date.now();
      const triggerTime = triggerDate.getTime();
      const secondsFromNow = Math.max(
        1,
        Math.floor((triggerTime - now) / 1000)
      );

      console.log(`🔔 Agendando notificação:`);
      console.log(`   - Título: ${notification.title}`);
      console.log(`   - Data/hora do trigger: ${triggerDate.toLocaleString()}`);
      console.log(`   - Segundos até o trigger: ${secondsFromNow}`);

      // Verificar se a data está no passado
      if (secondsFromNow <= 0) {
        console.error(`❌ Erro: Tentativa de agendar notificação no passado!`);
        return null;
      }

      // Usar DATE para notificações futuras (mais confiável)
      // TIME_INTERVAL tem limitações em algumas plataformas
      let trigger: Notifications.NotificationTriggerInput;

      if (secondsFromNow > 60) {
        // Para notificações mais de 1 minuto no futuro, usar DATE
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        } as Notifications.DateTriggerInput;
        console.log(`   - Usando trigger tipo DATE`);
      } else {
        // Para notificações imediatas ou muito próximas, usar TIME_INTERVAL
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
        } as Notifications.TimeIntervalTriggerInput;
        console.log(
          `   - Usando trigger tipo TIME_INTERVAL (${secondsFromNow}s)`
        );
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            ...notification.data,
            type: notification.type,
            notificationId: notification.id,
          },
          sound: config.sound ? "default" : undefined,
          badge: 1,
        },
        trigger,
      });

      console.log(`✅ Notificação agendada com sucesso! ID: ${notificationId}`);
      console.log(`   - Será exibida em: ${triggerDate.toLocaleString()}`);
      return notificationId;
    } catch (error) {
      console.error("❌ Erro ao agendar lembrete:", error);
      if (error instanceof Error) {
        console.error("   - Mensagem:", error.message);
        console.error("   - Stack:", error.stack);
      }
      return null;
    }
  }

  /**
   * Cancelar uma notificação específica
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`🗑️ Notificação cancelada: ${notificationId}`);
    } catch (error) {
      console.error("❌ Erro ao cancelar notificação:", error);
    }
  }

  /**
   * Cancelar todas as notificações
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("🗑️ Todas as notificações canceladas");
    } catch (error) {
      console.error("❌ Erro ao cancelar todas as notificações:", error);
    }
  }

  /**
   * Listar todas as notificações agendadas (para debug)
   */
  async getAllScheduledNotifications(): Promise<any[]> {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      console.log(
        `📋 Total de notificações agendadas: ${notifications.length}`
      );
      notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ID: ${notif.identifier}`);
        console.log(`      Título: ${notif.content.title}`);
        console.log(`      Trigger: ${JSON.stringify(notif.trigger)}`);
      });
      return notifications;
    } catch (error) {
      console.error("❌ Erro ao listar notificações agendadas:", error);
      return [];
    }
  }

  /**
   * Tocar som de notificação
   */
  async playNotificationSound(): Promise<void> {
    try {
      // Esta é uma implementação básica
      // Você pode adicionar sons customizados se necessário
      if (Platform.OS === "ios") {
        // No iOS, usar o som do sistema
        console.log("🔊 Tocando som de notificação (iOS)");
      } else {
        // No Android, usar vibração como feedback
        await this.vibrateDevice();
      }
    } catch (error) {
      console.error("❌ Erro ao tocar som:", error);
    }
  }

  /**
   * Vibrar o dispositivo
   */
  async vibrateDevice(): Promise<void> {
    try {
      // Padrão de vibração: curto-longo-curto
      Vibration.vibrate([100, 200, 100]);
      console.log("📳 Dispositivo vibrou");
    } catch (error) {
      console.error("❌ Erro ao vibrar:", error);
    }
  }

  /**
   * Obter token do Expo Push Notifications
   * Nota: Push notifications requerem Firebase configurado no Android
   * As notificações locais funcionam sem push token
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (this.expoPushToken) {
        return this.expoPushToken;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.log(
          "ℹ️  Project ID não encontrado para push notifications (opcional)"
        );
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log("🔑 Expo Push Token obtido:", this.expoPushToken);

      // Registrar token automaticamente com o backend
      try {
        const authService = AuthService.getInstance();
        await authService.registerPushToken(this.expoPushToken, "mobile");
        console.log("✅ Push token registrado com o backend automaticamente");
      } catch (registerError) {
        console.warn(
          "⚠️ Falha ao registrar push token com backend:",
          registerError
        );
        // Não falhar a obtenção do token se o registro falhar
      }

      return this.expoPushToken;
    } catch (error: any) {
      // Push notifications são opcionais - notificações locais funcionam sem push token
      const errorMessage = error?.message || String(error);

      if (errorMessage.includes("Firebase") || errorMessage.includes("FCM")) {
        console.log(
          "ℹ️  Push notifications não disponíveis (Firebase não configurado). Notificações locais continuam funcionando."
        );
      } else {
        console.log(
          "ℹ️  Push token não disponível (opcional). Notificações locais continuam funcionando."
        );
      }

      return null;
    }
  }

  /**
   * Configurar listeners para notificações
   */
  addNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (
      response: Notifications.NotificationResponse
    ) => void
  ): () => void {
    const subscription1 = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Log removido aqui para evitar duplicação - o NotificationManager já faz o log
        onNotificationReceived?.(notification);
      }
    );

    const subscription2 = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log(
          "👆 Usuário interagiu com notificação:",
          response.notification.request.content.title
        );
        onNotificationResponse?.(response);
      }
    );

    // Retornar função para cleanup
    return () => {
      subscription1.remove();
      subscription2.remove();
    };
  }

  /**
   * Limpar badge do app
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log("🔢 Badge count limpo");
    } catch (error) {
      console.error("❌ Erro ao limpar badge:", error);
    }
  }

  /**
   * Definir badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`🔢 Badge count definido para: ${count}`);
    } catch (error) {
      console.error("❌ Erro ao definir badge:", error);
    }
  }

  /**
   * Verificar se as notificações estão habilitadas
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("❌ Erro ao verificar permissões:", error);
      return false;
    }
  }
}
