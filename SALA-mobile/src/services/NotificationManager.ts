import { NotificationRepository } from '../repositories/NotificationRepository';
import { NativeNotificationService } from './NativeNotificationService';
import { NotificationPreferencesService } from './NotificationPreferencesService';
import { ReservationMonitorService } from './ReservationMonitorService';
import { ProfileService } from './ProfileService';
import { NotificationData, NotificationPreferences } from '../types/notifications';

/**
 * Gerenciador principal do sistema de notificações
 * Coordena todos os serviços de notificação
 */
export class NotificationManager {
  private static instance: NotificationManager;
  
  private notificationRepo?: NotificationRepository;
  private nativeService: NativeNotificationService;
  private preferencesService?: NotificationPreferencesService;
  private monitorService: ReservationMonitorService;
  
  private isInitialized = false;
  private currentUserId: string | null = null;
  private removeNotificationListeners?: () => void;

  private constructor() {
    this.nativeService = NativeNotificationService.getInstance();
    this.monitorService = ReservationMonitorService.getInstance();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Inicializar o sistema de notificações
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      console.log('🚀 Inicializando sistema de notificações...');
      
      this.currentUserId = userId;
      const token = ProfileService.getCurrentToken();
      
      if (!token) {
        console.warn('⚠️ Token não encontrado. Algumas funcionalidades podem não funcionar');
        return false;
      }

      // Inicializar serviços
      this.notificationRepo = new NotificationRepository(token);
      this.preferencesService = new NotificationPreferencesService(token);
      this.monitorService.initialize(token, userId);

      // Solicitar permissões de notificação
      const permissionsGranted = await this.nativeService.requestPermissions();
      if (!permissionsGranted) {
        console.warn('⚠️ Permissões de notificação não concedidas');
      }

      // Configurar listeners
      this.setupNotificationListeners();

      // Carregar preferências do usuário
      const preferences = await this.preferencesService.getPreferences(userId);
      
      // Iniciar monitoramento se habilitado
      if (preferences.statusChanges || preferences.reminderEnabled) {
        this.startMonitoring(preferences);
      }

      this.isInitialized = true;
      console.log('✅ Sistema de notificações inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de notificações:', error);
      return false;
    }
  }

  /**
   * Configurar listeners de notificação
   */
  private setupNotificationListeners(): void {
    this.removeNotificationListeners = this.nativeService.addNotificationListeners(
      this.handleNotificationReceived.bind(this),
      this.handleNotificationResponse.bind(this)
    );
  }

  /**
   * Manipular notificação recebida
   */
  private handleNotificationReceived(notification: any): void {
    console.log('📬 Notificação recebida:', notification.request.content.title);
    
    // Aqui você pode adicionar lógica personalizada
    // Como atualizar badge counts, vibrar, etc.
  }

  /**
   * Manipular resposta do usuário à notificação
   */
  private handleNotificationResponse(response: any): void {
    console.log('👆 Usuário interagiu com notificação');
    
    const notificationData = response.notification.request.content.data;
    
    // Navegar para tela apropriada baseado no tipo
    if (notificationData?.type && notificationData?.reservationId) {
      this.handleNotificationNavigation(notificationData);
    }
  }

  /**
   * Navegar para tela apropriada baseado na notificação
   */
  private handleNotificationNavigation(data: any): void {
    // Esta função deve ser implementada baseada na sua estrutura de navegação
    console.log('🧭 Navegando baseado na notificação:', data);
    
    // Exemplo de implementação:
    // switch (data.type) {
    //   case 'RESERVATION_APPROVED':
    //   case 'RESERVATION_REJECTED':
    //   case 'RESERVATION_CANCELLED':
    //     // Navegar para detalhes da reserva
    //     NavigationService.navigate('ReservationDetails', { id: data.reservationId });
    //     break;
    //   case 'RESERVATION_REMINDER':
    //     // Navegar para lista de reservas
    //     NavigationService.navigate('MyReservations');
    //     break;
    // }
  }

  /**
   * Iniciar monitoramento baseado nas preferências
   */
  private startMonitoring(preferences: NotificationPreferences): void {
    if (!this.currentUserId) return;

    // Monitoramento de mudanças de status
    if (preferences.statusChanges) {
      this.monitorService.startMonitoring(this.currentUserId, 5); // Verificar a cada 5 minutos
      console.log('🔍 Monitoramento de status iniciado');
    }

    // Agendamento de lembretes
    if (preferences.reminderEnabled) {
      this.monitorService.scheduleReservationReminders(
        this.currentUserId, 
        preferences.reminderMinutes
      );
      console.log(`⏰ Lembretes agendados para ${preferences.reminderMinutes} minutos`);
    }
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    this.monitorService.stopMonitoring();
    console.log('🛑 Monitoramento parado');
  }

  /**
   * Buscar notificações do usuário
   */
  async getNotifications(limit?: number): Promise<NotificationData[]> {
    if (!this.notificationRepo || !this.currentUserId) {
      return [];
    }
    
    try {
      return await this.notificationRepo.getNotifications(this.currentUserId, limit);
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return [];
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!this.notificationRepo) return;
    
    try {
      await this.notificationRepo.markAsRead(notificationId);
      console.log('✅ Notificação marcada como lida:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(): Promise<void> {
    if (!this.notificationRepo || !this.currentUserId) return;
    
    try {
      await this.notificationRepo.markAllAsRead(this.currentUserId);
      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
    }
  }

  /**
   * Obter contagem de notificações não lidas
   */
  async getUnreadCount(): Promise<number> {
    if (!this.notificationRepo || !this.currentUserId) {
      return 0;
    }
    
    try {
      return await this.notificationRepo.getUnreadCount(this.currentUserId);
    } catch (error) {
      console.error('❌ Erro ao obter contagem:', error);
      return 0;
    }
  }

  /**
   * Atualizar preferências de notificação
   */
  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<boolean> {
    if (!this.preferencesService || !this.currentUserId) {
      return false;
    }
    
    try {
      const updatedPreferences = await this.preferencesService.updatePreferences(
        this.currentUserId, 
        updates
      );
      
      // Reconfigurar monitoramento baseado nas novas preferências
      this.stopMonitoring();
      
      if (updatedPreferences.statusChanges || updatedPreferences.reminderEnabled) {
        this.startMonitoring(updatedPreferences);
      }
      
      console.log('✅ Preferências atualizadas e monitoramento reconfigurado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error);
      return false;
    }
  }

  /**
   * Limpar badge do app
   */
  async clearBadge(): Promise<void> {
    await this.nativeService.clearBadgeCount();
  }

  /**
   * Definir badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await this.nativeService.setBadgeCount(count);
  }

  /**
   * Verificar se as notificações estão habilitadas
   */
  async areNotificationsEnabled(): Promise<boolean> {
    return await this.nativeService.areNotificationsEnabled();
  }

  /**
   * Obter estatísticas do sistema
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      currentUserId: this.currentUserId,
      monitoring: this.monitorService.getMonitoringStats(),
      hasPermissions: this.nativeService.areNotificationsEnabled(),
    };
  }

  /**
   * Finalizar sistema de notificações
   */
  destroy(): void {
    console.log('🧹 Finalizando sistema de notificações...');
    
    this.stopMonitoring();
    
    if (this.removeNotificationListeners) {
      this.removeNotificationListeners();
    }
    
    this.isInitialized = false;
    this.currentUserId = null;
    
    console.log('✅ Sistema de notificações finalizado');
  }
}