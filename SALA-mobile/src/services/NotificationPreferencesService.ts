import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../utils/config';
import { 
  NotificationPreferences,
  INotificationPreferencesService,
  UpdateNotificationPreferencesRequest,
  NotificationType
} from '../types/notifications';

/**
 * Service responsável por gerenciar as preferências de notificação do usuário
 * Implementa os princípios SOLID: SRP, OCP, DIP
 */
export class NotificationPreferencesService implements INotificationPreferencesService {
  private static readonly PREFERENCES_CACHE_KEY = 'notification_preferences';
  
  private api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  });

  constructor(private authToken?: string) {
    if (authToken) {
      this.api.defaults.headers.authorization = `Bearer ${authToken}`;
    }
  }

  /**
   * Buscar preferências do usuário (com cache local como fallback)
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Tentar buscar da API primeiro
      const response = await this.api.get(`/notifications/preferences/${userId}`);
      
      if (response.data.success) {
        const preferences: NotificationPreferences = response.data.preferences;
        
        // Salvar no cache local
        await this.cachePreferences(userId, preferences);
        
        console.log('📱 Preferências carregadas da API');
        return preferences;
      }

      // Fallback para cache local
      return this.getCachedPreferences(userId);
    } catch (error) {
      console.warn('⚠️ Erro ao buscar preferências da API, usando cache local:', error);
      return this.getCachedPreferences(userId);
    }
  }

  /**
   * Atualizar preferências do usuário
   */
  async updatePreferences(
    userId: string, 
    updates: UpdateNotificationPreferencesRequest
  ): Promise<NotificationPreferences> {
    try {
      const response = await this.api.patch(
        `/notifications/preferences/${userId}`,
        updates
      );

      if (response.data.success) {
        const updatedPreferences: NotificationPreferences = response.data.preferences;
        
        // Atualizar cache local
        await this.cachePreferences(userId, updatedPreferences);
        
        console.log('✅ Preferências atualizadas com sucesso');
        return updatedPreferences;
      }

      throw new Error('Falha ao atualizar preferências');
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error);
      
      // Em caso de erro, tentar atualizar apenas o cache local
      const cachedPreferences = await this.getCachedPreferences(userId);
      const updatedPreferences = { ...cachedPreferences, ...updates };
      await this.cachePreferences(userId, updatedPreferences);
      
      console.log('⚠️ Preferências salvas apenas localmente');
      return updatedPreferences;
    }
  }

  /**
   * Verificar se está no horário silencioso configurado
   */
  isQuietTime(): boolean {
    try {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde 00:00
      
      // Estas preferências deveriam vir do cache do usuário atual
      // Para simplicidade, usando valores padrão
      const quietStart = this.timeStringToMinutes('22:00'); // 22:00
      const quietEnd = this.timeStringToMinutes('07:00'); // 07:00

      // Se quietStart > quietEnd, significa que o período cruza a meia-noite
      if (quietStart > quietEnd) {
        return currentTime >= quietStart || currentTime <= quietEnd;
      } else {
        return currentTime >= quietStart && currentTime <= quietEnd;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar horário silencioso:', error);
      return false;
    }
  }

  /**
   * Verificar se deve notificar para um tipo específico
   */
  shouldNotifyForType(type: NotificationType, preferences: NotificationPreferences): boolean {
    try {
      // Verificar se push notifications estão ativadas
      if (!preferences.pushEnabled) {
        return false;
      }

      // Verificar se está no horário silencioso
      if (preferences.quietHoursEnabled && this.isQuietTime()) {
        return false;
      }

      // Verificar preferências específicas por tipo
      switch (type) {
        case NotificationType.RESERVATION_APPROVED:
        case NotificationType.RESERVATION_REJECTED:
        case NotificationType.RESERVATION_CANCELLED:
          return preferences.statusChanges;

        case NotificationType.RESERVATION_REMINDER:
        case NotificationType.RESERVATION_EXPIRING:
          return preferences.reminderEnabled;

        case NotificationType.SYSTEM_UPDATE:
          return true; // Sempre permitir notificações do sistema

        default:
          return true;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar se deve notificar:', error);
      return false;
    }
  }

  /**
   * Obter opções de lembrete disponíveis
   */
  static getReminderOptions(): Array<{ label: string; value: number }> {
    return [
      { label: '5 minutos antes', value: 5 },
      { label: '15 minutos antes', value: 15 },
      { label: '30 minutos antes', value: 30 },
      { label: '1 hora antes', value: 60 },
      { label: '2 horas antes', value: 120 },
    ];
  }

  // --- Métodos privados ---

  private async getCachedPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const cacheKey = `${NotificationPreferencesService.PREFERENCES_CACHE_KEY}_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Retornar preferências padrão se não houver cache
      return this.getDefaultPreferences(userId);
    } catch (error) {
      console.error('❌ Erro ao ler cache de preferências:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  private async cachePreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      const cacheKey = `${NotificationPreferencesService.PREFERENCES_CACHE_KEY}_${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(preferences));
    } catch (error) {
      console.error('❌ Erro ao salvar cache de preferências:', error);
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      id: `pref_${userId}`,
      userId,
      statusChanges: true,
      reminderEnabled: true,
      reminderMinutes: 15,
      pushEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}