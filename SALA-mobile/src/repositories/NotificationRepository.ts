import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '../utils/config';
import { 
  NotificationData, 
  INotificationRepository,
  CreateNotificationRequest 
} from '../types/notifications';

/**
 * Repository responsável por gerenciar o acesso aos dados de notificações
 * Implementa cache local e sincronização com a API
 */
export class NotificationRepository implements INotificationRepository {
  private static readonly CACHE_KEY = 'notifications_cache';
  private static readonly CACHE_EXPIRY_KEY = 'notifications_cache_expiry';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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
   * Buscar notificações do usuário com cache local
   */
  async getNotifications(userId: string, limit: number = 20): Promise<NotificationData[]> {
    try {
      // Tentar buscar do cache primeiro
      const cachedData = await this.getCachedNotifications(userId);
      if (cachedData.length > 0 && !this.isCacheExpired()) {
        console.log('📱 Notificações carregadas do cache');
        return cachedData;
      }

      // Buscar da API
      const response = await this.api.get(`/notifications/${userId}`, {
        params: { limit }
      });

      if (response.data.success) {
        const notifications: NotificationData[] = response.data.notifications;
        
        // Salvar no cache
        await this.cacheNotifications(userId, notifications);
        
        console.log(`📱 ${notifications.length} notificações carregadas da API`);
        return notifications;
      }

      return [];
    } catch (error) {
      console.warn('⚠️ Erro ao buscar notificações, usando cache:', error);
      return this.getCachedNotifications(userId);
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.api.patch(`/notifications/${notificationId}/read`);
      
      // Atualizar cache local
      await this.updateNotificationInCache(notificationId, { read: true });
      
      console.log('✅ Notificação marcada como lida:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.api.patch(`/notifications/${userId}/read-all`);
      
      // Atualizar cache local
      await this.updateAllNotificationsInCache(userId, { read: true });
      
      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  /**
   * Deletar notificação
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.api.delete(`/notifications/${notificationId}`);
      
      // Remover do cache
      await this.removeNotificationFromCache(notificationId);
      
      console.log('🗑️ Notificação deletada:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error);
      throw error;
    }
  }

  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await this.api.get(`/notifications/${userId}/unread-count`);
      
      if (response.data.success) {
        return response.data.count;
      }

      return 0;
    } catch (error) {
      console.warn('⚠️ Erro ao buscar contagem, calculando do cache:', error);
      
      // Calcular do cache local
      const cached = await this.getCachedNotifications(userId);
      return cached.filter(n => !n.read).length;
    }
  }

  // --- Métodos privados para cache ---

  private async getCachedNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const cached = await AsyncStorage.getItem(`${NotificationRepository.CACHE_KEY}_${userId}`);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('❌ Erro ao ler cache de notificações:', error);
      return [];
    }
  }

  private async cacheNotifications(userId: string, notifications: NotificationData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${NotificationRepository.CACHE_KEY}_${userId}`,
        JSON.stringify(notifications)
      );
      await AsyncStorage.setItem(
        `${NotificationRepository.CACHE_EXPIRY_KEY}_${userId}`,
        Date.now().toString()
      );
    } catch (error) {
      console.error('❌ Erro ao salvar cache de notificações:', error);
    }
  }

  private async isCacheExpired(): Promise<boolean> {
    try {
      const expiry = await AsyncStorage.getItem(NotificationRepository.CACHE_EXPIRY_KEY);
      if (!expiry) return true;
      
      const age = Date.now() - parseInt(expiry);
      return age > NotificationRepository.CACHE_DURATION;
    } catch {
      return true;
    }
  }

  private async updateNotificationInCache(
    notificationId: string, 
    updates: Partial<NotificationData>
  ): Promise<void> {
    try {
      // Esta é uma implementação simplificada
      // Em um app real, você buscaria o userId atual do contexto
      const allCacheKeys = await AsyncStorage.getAllKeys();
      const notificationCacheKeys = allCacheKeys.filter(key => 
        key.startsWith(NotificationRepository.CACHE_KEY)
      );

      for (const cacheKey of notificationCacheKeys) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const notifications: NotificationData[] = JSON.parse(cached);
          const updatedNotifications = notifications.map(n => 
            n.id === notificationId ? { ...n, ...updates } : n
          );
          await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedNotifications));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar cache:', error);
    }
  }

  private async updateAllNotificationsInCache(
    userId: string,
    updates: Partial<NotificationData>
  ): Promise<void> {
    try {
      const cacheKey = `${NotificationRepository.CACHE_KEY}_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const notifications: NotificationData[] = JSON.parse(cached);
        const updatedNotifications = notifications.map(n => ({ ...n, ...updates }));
        await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedNotifications));
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar todas no cache:', error);
    }
  }

  /**
   * Criar uma nova notificação
   */
  async createNotification(request: CreateNotificationRequest): Promise<NotificationData | null> {
    try {
      const response = await this.api.post('/notifications', request);
      
      if (response.data.success) {
        const notification: NotificationData = response.data.notification;
        console.log('✅ Notificação criada:', notification.id);
        
        // Adicionar ao cache local
        await this.addToCache(request.userId, notification);
        
        return notification;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      
      // Em caso de erro de rede, criar localmente
      const localNotification: NotificationData = {
        id: `local-${Date.now()}`,
        userId: request.userId,
        type: request.type,
        title: request.title,
        body: request.body,
        data: request.data,
        read: false,
        createdAt: new Date().toISOString(),
        reservationId: request.reservationId,
      };
      
      await this.addToCache(request.userId, localNotification);
      return localNotification;
    }
  }

  /**
   * Adicionar notificação ao cache
   */
  private async addToCache(userId: string, notification: NotificationData): Promise<void> {
    try {
      const cacheKey = `${NotificationRepository.CACHE_KEY}_${userId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      let notifications: NotificationData[] = [];
      if (cached) {
        notifications = JSON.parse(cached);
      }
      
      // Adicionar no início da lista
      notifications.unshift(notification);
      
      // Manter apenas os últimos 50
      if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(notifications));
      console.log('💾 Notificação adicionada ao cache');
    } catch (error) {
      console.error('❌ Erro ao adicionar ao cache:', error);
    }
  }
  private async removeNotificationFromCache(notificationId: string): Promise<void> {
    try {
      const allCacheKeys = await AsyncStorage.getAllKeys();
      const notificationCacheKeys = allCacheKeys.filter(key => 
        key.startsWith(NotificationRepository.CACHE_KEY)
      );

      for (const cacheKey of notificationCacheKeys) {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const notifications: NotificationData[] = JSON.parse(cached);
          const filteredNotifications = notifications.filter(n => n.id !== notificationId);
          await AsyncStorage.setItem(cacheKey, JSON.stringify(filteredNotifications));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao remover do cache:', error);
    }
  }
}