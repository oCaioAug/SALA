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
      // Evitar inicialização múltipla
      if (this.isInitialized && this.currentUserId === userId) {
        console.log('ℹ️  Sistema de notificações já inicializado para este usuário');
        return true;
      }
      
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
      console.log('📋 Carregando preferências de notificação...');
      const preferences = await this.preferencesService.getPreferences(userId);
      console.log('📋 Preferências carregadas:', {
        reminderEnabled: preferences.reminderEnabled,
        reminderMinutes: preferences.reminderMinutes,
        statusChanges: preferences.statusChanges,
      });
      
      // Iniciar monitoramento se habilitado
      if (preferences.statusChanges || preferences.reminderEnabled) {
        console.log('▶️ Iniciando monitoramento com preferências:', preferences);
        this.startMonitoring(preferences);
      } else {
        console.log('⏸️ Monitoramento não iniciado: preferências desabilitadas');
        console.log('   - reminderEnabled:', preferences.reminderEnabled);
        console.log('   - statusChanges:', preferences.statusChanges);
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
    // Remover listeners anteriores se existirem
    if (this.removeNotificationListeners) {
      console.log('🔄 Removendo listeners anteriores de notificação');
      this.removeNotificationListeners();
    }
    
    // Registrar novos listeners
    this.removeNotificationListeners = this.nativeService.addNotificationListeners(
      this.handleNotificationReceived.bind(this),
      this.handleNotificationResponse.bind(this)
    );
    console.log('✅ Listeners de notificação configurados');
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
    if (!this.currentUserId) {
      console.error('❌ Não é possível iniciar monitoramento: userId não definido');
      return;
    }

    console.log('🔍 Iniciando monitoramento...');
    console.log('   - UserId:', this.currentUserId);
    console.log('   - Preferências:', {
      reminderEnabled: preferences.reminderEnabled,
      reminderMinutes: preferences.reminderMinutes,
      statusChanges: preferences.statusChanges,
    });

    // Monitoramento de mudanças de status
    if (preferences.statusChanges) {
      this.monitorService.startMonitoring(this.currentUserId, 5); // Verificar a cada 5 minutos
      console.log('✅ Monitoramento de status iniciado');
    } else {
      console.log('⏭️  Monitoramento de status não iniciado (desabilitado)');
    }

    // Agendamento de lembretes
    if (preferences.reminderEnabled) {
      console.log(`⏰ Iniciando agendamento de lembretes (${preferences.reminderMinutes} minutos antes)...`);
      this.monitorService.scheduleReservationReminders(
        this.currentUserId, 
        preferences.reminderMinutes
      ).then(() => {
        console.log(`✅ Agendamento de lembretes concluído`);
      }).catch((error) => {
        console.error('❌ Erro ao agendar lembretes:', error);
      });
    } else {
      console.log('⏭️  Agendamento de lembretes não iniciado (desabilitado)');
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
   * Reagendar lembretes de reservas (útil após criar nova reserva)
   */
  async rescheduleReminders(): Promise<void> {
    if (!this.currentUserId || !this.preferencesService) {
      return;
    }

    try {
      const preferences = await this.preferencesService.getPreferences(this.currentUserId);
      if (preferences.reminderEnabled) {
        await this.monitorService.scheduleReservationReminders(
          this.currentUserId,
          preferences.reminderMinutes
        );
        console.log('✅ Lembretes reagendados');
      }
    } catch (error) {
      console.error('❌ Erro ao reagendar lembretes:', error);
    }
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