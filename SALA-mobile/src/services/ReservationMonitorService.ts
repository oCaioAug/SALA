import { ReservationStatusEnum } from '../types';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NativeNotificationService } from './NativeNotificationService';
import { NotificationType, CreateNotificationRequest, NotificationData } from '../types/notifications';

/**
 * Interface para dados de reserva simplificados
 */
interface ReservationData {
  id: string;
  status: ReservationStatusEnum;
  startTime: string;
  roomName: string;
  userName: string;
}

/**
 * Service responsável por monitorar mudanças nas reservas
 * e disparar notificações adequadas
 */
export class ReservationMonitorService {
  private static instance: ReservationMonitorService;
  private notificationRepo?: NotificationRepository;
  private nativeNotificationService: NativeNotificationService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastKnownReservations: Map<string, ReservationStatusEnum> = new Map();
  private currentUserId: string | null = null;

  private constructor() {
    this.nativeNotificationService = NativeNotificationService.getInstance();
  }

  public static getInstance(): ReservationMonitorService {
    if (!ReservationMonitorService.instance) {
      ReservationMonitorService.instance = new ReservationMonitorService();
    }
    return ReservationMonitorService.instance;
  }

  /**
   * Inicializar o serviço com token de autenticação
   */
  initialize(authToken: string, userId: string): void {
    this.notificationRepo = new NotificationRepository(authToken);
    this.currentUserId = userId;
    console.log('🔧 ReservationMonitorService inicializado');
  }

  /**
   * Iniciar monitoramento de reservas
   */
  startMonitoring(userId: string, checkIntervalMinutes: number = 5): void {
    console.log(`🔍 Iniciando monitoramento de reservas para usuário ${userId}`);
    
    // Parar monitoramento anterior se existir
    this.stopMonitoring();

    // Iniciar novo monitoramento
    this.monitoringInterval = setInterval(async () => {
      await this.checkReservationUpdates(userId);
    }, checkIntervalMinutes * 60 * 1000); // Converter para millisegundos

    // Verificar imediatamente
    this.checkReservationUpdates(userId);
  }

  /**
   * Parar monitoramento de reservas
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Monitoramento de reservas parado');
    }
  }

  /**
   * Verificar atualizações nas reservas do usuário
   */
  private async checkReservationUpdates(userId: string): Promise<void> {
    try {
      // Buscar reservas do usuário através da API
      const reservations = await this.fetchUserReservations(userId);
      
      // Verificar mudanças de status
      for (const reservation of reservations) {
        await this.checkStatusChange(reservation);
      }

      console.log(`✅ Verificação de reservas concluída - ${reservations.length} reservas analisadas`);
    } catch (error) {
      console.error('❌ Erro ao verificar reservas:', error);
    }
  }

  /**
   * Verificar se houve mudança de status em uma reserva
   */
  private async checkStatusChange(reservation: ReservationData): Promise<void> {
    const lastStatus = this.lastKnownReservations.get(reservation.id);
    
    if (lastStatus && lastStatus !== reservation.status) {
      // Houve mudança de status - disparar notificação
      await this.sendStatusChangeNotification(reservation, lastStatus);
    }

    // Atualizar status conhecido
    this.lastKnownReservations.set(reservation.id, reservation.status);
  }

  /**
   * Enviar notificação de mudança de status
   */
  private async sendStatusChangeNotification(
    reservation: ReservationData, 
    oldStatus: ReservationStatusEnum
  ): Promise<void> {
    try {
      const statusMessages = {
        [ReservationStatusEnum.APPROVED]: 'Sua reserva foi aprovada! ✅',
        [ReservationStatusEnum.REJECTED]: 'Sua reserva foi rejeitada 😔',
        [ReservationStatusEnum.CANCELLED]: 'Sua reserva foi cancelada 🚫',
        [ReservationStatusEnum.COMPLETED]: 'Sua reserva foi concluída ✨',
        [ReservationStatusEnum.PENDING]: 'Sua reserva está aguardando aprovação ⏳',
        [ReservationStatusEnum.ACTIVE]: 'Sua reserva está ativa! 🎉',
      };

      const notificationRequest: CreateNotificationRequest = {
        userId: this.currentUserId!,
        type: this.getNotificationTypeForStatus(reservation.status),
        title: 'Status da Reserva Atualizado',
        body: `${statusMessages[reservation.status]} - Sala: ${reservation.roomName}`,
        data: {
          reservationId: reservation.id,
          newStatus: reservation.status,
          oldStatus,
          roomName: reservation.roomName,
        },
        reservationId: reservation.id,
      };

      // Criar notificação via repositório
      if (this.notificationRepo) {
        const notification = await this.notificationRepo.createNotification(notificationRequest);
        
        if (notification) {
          // Enviar notificação nativa
          await this.nativeNotificationService.schedulePushNotification(notification);
          console.log(`🔔 Notificação enviada: Reserva ${reservation.id} mudou de ${oldStatus} para ${reservation.status}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de mudança de status:', error);
    }
  }

  /**
   * Agendar lembretes para reservas próximas
   */
  async scheduleReservationReminders(
    userId: string, 
    reminderMinutes: number = 30
  ): Promise<void> {
    try {
      const reservations = await this.fetchUserReservations(userId);
      const upcomingReservations = reservations.filter(r => 
        r.status === ReservationStatusEnum.APPROVED || r.status === ReservationStatusEnum.ACTIVE
      );

      for (const reservation of upcomingReservations) {
        await this.scheduleReminderForReservation(reservation, reminderMinutes);
      }

      console.log(`⏰ ${upcomingReservations.length} lembretes agendados`);
    } catch (error) {
      console.error('❌ Erro ao agendar lembretes:', error);
    }
  }

  /**
   * Agendar lembrete para uma reserva específica
   */
  private async scheduleReminderForReservation(
    reservation: ReservationData,
    reminderMinutes: number
  ): Promise<void> {
    try {
      const startTime = new Date(reservation.startTime);
      const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60 * 1000));

      // Só agendar se o lembrete for no futuro
      if (reminderTime > new Date()) {
        const notificationRequest: CreateNotificationRequest = {
          userId: this.currentUserId!,
          type: NotificationType.RESERVATION_REMINDER,
          title: `Lembrete: Reserva em ${reminderMinutes} minutos`,
          body: `Sua reserva na sala ${reservation.roomName} começará às ${startTime.toLocaleTimeString()}`,
          data: {
            reservationId: reservation.id,
            roomName: reservation.roomName,
            startTime: reservation.startTime,
            reminderMinutes,
          },
          reservationId: reservation.id,
        };

        // Criar notificação via repositório
        if (this.notificationRepo) {
          const notification = await this.notificationRepo.createNotification(notificationRequest);
          
          if (notification) {
            // Agendar notificação nativa
            await this.nativeNotificationService.scheduleTimedNotification(notification, reminderTime);
            console.log(`⏰ Lembrete agendado para reserva ${reservation.id} às ${reminderTime.toLocaleString()}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao agendar lembrete:', error);
    }
  }

  /**
   * Mapear status de reserva para tipo de notificação
   */
  private getNotificationTypeForStatus(status: ReservationStatusEnum): NotificationType {
    switch (status) {
      case ReservationStatusEnum.APPROVED:
        return NotificationType.RESERVATION_APPROVED;
      case ReservationStatusEnum.REJECTED:
        return NotificationType.RESERVATION_REJECTED;
      case ReservationStatusEnum.CANCELLED:
        return NotificationType.RESERVATION_CANCELLED;
      default:
        return NotificationType.SYSTEM_UPDATE;
    }
  }

  /**
   * Buscar reservas do usuário via API
   * Esta é uma implementação mock - substitua pela chamada real da API
   */
  private async fetchUserReservations(userId: string): Promise<ReservationData[]> {
    try {
      // TODO: Implementar chamada real para a API
      // Por enquanto, retornar array vazio para evitar erros
      console.log(`📡 Buscando reservas para usuário ${userId}...`);
      
      // Exemplo de implementação:
      // const response = await api.get(`/reservations?userId=${userId}`);
      // return response.data;
      
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar reservas:', error);
      return [];
    }
  }

  /**
   * Cancelar todos os lembretes de um usuário
   */
  async cancelAllReminders(): Promise<void> {
    try {
      await this.nativeNotificationService.cancelAllNotifications();
      console.log('🗑️ Todos os lembretes cancelados');
    } catch (error) {
      console.error('❌ Erro ao cancelar lembretes:', error);
    }
  }

  /**
   * Obter estatísticas do monitoramento
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    trackedReservations: number;
    lastCheck: Date | null;
  } {
    return {
      isMonitoring: this.monitoringInterval !== null,
      trackedReservations: this.lastKnownReservations.size,
      lastCheck: null, // Você pode implementar um timestamp da última verificação
    };
  }
}