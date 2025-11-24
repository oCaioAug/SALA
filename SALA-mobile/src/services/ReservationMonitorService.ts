import { ReservationStatusEnum } from '../types';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { NativeNotificationService } from './NativeNotificationService';
import { NotificationType, CreateNotificationRequest, NotificationData } from '../types/notifications';
import ApiService from './api';

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
      console.log(`🔄 Iniciando agendamento de lembretes...`);
      console.log(`   - UserId: ${userId}`);
      console.log(`   - Minutos antes: ${reminderMinutes}`);
      
      // Cancelar lembretes antigos antes de agendar novos
      console.log(`🗑️  Cancelando lembretes antigos...`);
      await this.cancelAllReminders();
      
      console.log(`📡 Buscando reservas do usuário...`);
      const reservations = await this.fetchUserReservations(userId);
      console.log(`   - Total de reservas encontradas: ${reservations.length}`);
      
      const upcomingReservations = reservations.filter(r => {
        const startTime = new Date(r.startTime);
        const now = new Date();
        const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60 * 1000));
        
        // Filtrar apenas reservas futuras, aprovadas/ativas e cujo lembrete ainda não passou
        const isValid = (
          (r.status === ReservationStatusEnum.APPROVED || r.status === ReservationStatusEnum.ACTIVE) &&
          startTime > now &&
          reminderTime > now
        );
        
        if (!isValid) {
          console.log(`   - Reserva ${r.id} filtrada: status=${r.status}, startTime=${startTime.toLocaleString()}, reminderTime=${reminderTime.toLocaleString()}`);
        }
        
        return isValid;
      });

      console.log(`📅 Encontradas ${upcomingReservations.length} reservas válidas para agendar lembretes`);

      if (upcomingReservations.length === 0) {
        console.log('ℹ️  Nenhuma reserva futura encontrada para agendar lembretes.');
        console.log('   - Verifique se há reservas aprovadas com data/hora futura');
        console.log('   - Lembretes só são agendados se o horário do lembrete ainda não passou');
      }

      let scheduledCount = 0;
      const scheduledNotifications: Array<{ id: string; date: Date; room: string }> = [];
      
      for (const reservation of upcomingReservations) {
        const notificationId = await this.scheduleReminderForReservation(reservation, reminderMinutes);
        if (notificationId) {
          scheduledCount++;
          const startTime = new Date(reservation.startTime);
          const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60 * 1000));
          scheduledNotifications.push({
            id: notificationId,
            date: reminderTime,
            room: reservation.roomName,
          });
        }
      }

      console.log(`✅ Processo concluído: ${scheduledCount} lembretes processados`);
      
      // Mostrar resumo das notificações agendadas
      if (scheduledCount > 0) {
        console.log(`\n📋 RESUMO DAS NOTIFICAÇÕES AGENDADAS:`);
        scheduledNotifications
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .forEach((notif, index) => {
            const now = new Date();
            const timeUntil = Math.floor((notif.date.getTime() - now.getTime()) / 1000 / 60); // minutos
            const timeStr = timeUntil < 60 
              ? `em ${timeUntil} minuto(s)`
              : timeUntil < 1440
              ? `em ${Math.floor(timeUntil / 60)} hora(s)`
              : `em ${Math.floor(timeUntil / 1440)} dia(s)`;
            
            console.log(`   ${index + 1}. Sala: ${notif.room}`);
            console.log(`      ⏰ Será exibida: ${notif.date.toLocaleString('pt-BR')} (${timeStr})`);
          });
        
        // Listar todas as notificações agendadas para debug
        const allScheduled = await this.nativeNotificationService.getAllScheduledNotifications();
        console.log(`\n📋 Verificação: ${allScheduled.length} notificações agendadas no sistema nativo`);
      }
    } catch (error) {
      console.error('❌ Erro ao agendar lembretes:', error);
      if (error instanceof Error) {
        console.error('   - Mensagem:', error.message);
        console.error('   - Stack:', error.stack);
      }
    }
  }

  /**
   * Agendar lembrete para uma reserva específica
   * @returns ID da notificação agendada ou null se não foi possível agendar
   */
  private async scheduleReminderForReservation(
    reservation: ReservationData,
    reminderMinutes: number
  ): Promise<string | null> {
    try {
      const startTime = new Date(reservation.startTime);
      const reminderTime = new Date(startTime.getTime() - (reminderMinutes * 60 * 1000));
      const now = new Date();

      console.log(`📅 Processando reserva ${reservation.id}:`);
      console.log(`   - Início: ${startTime.toLocaleString()}`);
      console.log(`   - Lembrete: ${reminderTime.toLocaleString()}`);
      console.log(`   - Agora: ${now.toLocaleString()}`);

      // Só agendar se o lembrete for no futuro
      if (reminderTime <= now) {
        console.log(`⏭️  Pulando reserva ${reservation.id}: lembrete já passou`);
        return null;
      }

      // Criar objeto de notificação diretamente (sem depender do repositório)
      const notification: NotificationData = {
        id: `reminder-${reservation.id}-${Date.now()}`,
        userId: this.currentUserId!,
        type: NotificationType.RESERVATION_REMINDER,
        title: `Lembrete: Reserva em ${reminderMinutes} minutos`,
        body: `Sua reserva na sala ${reservation.roomName} começará às ${startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        data: {
          reservationId: reservation.id,
          roomName: reservation.roomName,
          startTime: reservation.startTime,
          reminderMinutes,
        },
        read: false,
        createdAt: new Date().toISOString(),
        reservationId: reservation.id,
      };

      // Agendar notificação nativa diretamente
      const notificationId = await this.nativeNotificationService.scheduleTimedNotification(
        notification,
        reminderTime
      );

      if (notificationId) {
        console.log(`✅ Lembrete agendado com sucesso! ID: ${notificationId}`);
        console.log(`   - Reserva: ${reservation.id}`);
        console.log(`   - Sala: ${reservation.roomName}`);
        console.log(`   - Horário do lembrete: ${reminderTime.toLocaleString()}`);
        
        // Tentar criar notificação no backend (opcional, não bloqueia)
        // Nota: Lembretes são agendados localmente, não precisam ser salvos no backend
        // O backend pode não suportar RESERVATION_REMINDER, então silenciosamente ignoramos erros
        if (this.notificationRepo) {
          try {
            const notificationRequest: CreateNotificationRequest = {
              userId: this.currentUserId!,
              type: NotificationType.RESERVATION_REMINDER,
              title: notification.title,
              body: notification.body,
              data: notification.data,
              reservationId: reservation.id,
            };
            await this.notificationRepo.createNotification(notificationRequest);
            console.log('✅ Notificação de lembrete salva no backend');
          } catch (backendError: any) {
            // Erros 400/500 ao criar notificação no backend não são críticos
            // As notificações nativas já foram agendadas com sucesso localmente
            const status = backendError?.response?.status;
            if (status === 400) {
              console.log('ℹ️  Backend não suporta notificações de lembrete (esperado). Notificação nativa agendada com sucesso.');
            } else if (status === 500) {
              console.log('ℹ️  Erro no servidor ao salvar notificação (não crítico). Notificação nativa agendada com sucesso.');
            } else {
              console.log('ℹ️  Falha ao criar notificação no backend (não crítico). Notificação nativa agendada com sucesso.');
            }
          }
        }
        
        return notificationId;
      } else {
        console.error(`❌ Falha ao agendar notificação nativa para reserva ${reservation.id}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Erro ao agendar lembrete para reserva ${reservation.id}:`, error);
      return null;
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
   */
  private async fetchUserReservations(userId: string): Promise<ReservationData[]> {
    try {
      console.log(`📡 Buscando reservas para usuário ${userId}...`);
      
      // Buscar reservas do usuário via API
      const reservations = await ApiService.getUserReservations(userId);
      
      // Mapear para o formato ReservationData
      const mappedReservations: ReservationData[] = reservations.map((reservation) => ({
        id: reservation.id,
        status: reservation.status,
        startTime: reservation.startTime,
        roomName: reservation.room?.name || 'Sala desconhecida',
        userName: reservation.user?.name || 'Usuário desconhecido',
      }));
      
      console.log(`✅ ${mappedReservations.length} reservas encontradas para o usuário`);
      return mappedReservations;
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