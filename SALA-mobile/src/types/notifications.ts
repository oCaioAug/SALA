// Tipos e interfaces para o sistema de notificações
export interface NotificationPreferences {
  id: string;
  userId: string;
  statusChanges: boolean; // Notificar mudanças de status
  reminderEnabled: boolean; // Notificar lembretes
  reminderMinutes: number; // Minutos antes da reserva (5, 15, 30, 60)
  pushEnabled: boolean; // Push notifications ativadas
  soundEnabled: boolean; // Som nas notificações
  vibrationEnabled: boolean; // Vibração nas notificações
  quietHoursEnabled: boolean; // Modo silencioso
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  reservationId?: string;
}

export enum NotificationType {
  RESERVATION_APPROVED = 'RESERVATION_APPROVED',
  RESERVATION_REJECTED = 'RESERVATION_REJECTED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  RESERVATION_REMINDER = 'RESERVATION_REMINDER',
  RESERVATION_EXPIRING = 'RESERVATION_EXPIRING',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}

export interface NotificationConfig {
  icon: string;
  color: string;
  sound?: boolean;
  vibration?: boolean;
  priority: 'high' | 'normal' | 'low';
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  [NotificationType.RESERVATION_APPROVED]: {
    icon: 'checkmark-circle',
    color: '#10B981',
    sound: true,
    vibration: true,
    priority: 'high'
  },
  [NotificationType.RESERVATION_REJECTED]: {
    icon: 'close-circle',
    color: '#EF4444',
    sound: true,
    vibration: true,
    priority: 'high'
  },
  [NotificationType.RESERVATION_CANCELLED]: {
    icon: 'ban',
    color: '#F59E0B',
    sound: true,
    vibration: false,
    priority: 'normal'
  },
  [NotificationType.RESERVATION_REMINDER]: {
    icon: 'time',
    color: '#3B82F6',
    sound: true,
    vibration: true,
    priority: 'high'
  },
  [NotificationType.RESERVATION_EXPIRING]: {
    icon: 'warning',
    color: '#F59E0B',
    sound: true,
    vibration: true,
    priority: 'high'
  },
  [NotificationType.SYSTEM_UPDATE]: {
    icon: 'information-circle',
    color: '#6B7280',
    sound: false,
    vibration: false,
    priority: 'low'
  }
};

// Interfaces para serviços
export interface INotificationService {
  requestPermissions(): Promise<boolean>;
  schedulePushNotification(notification: NotificationData): Promise<string | null>;
  cancelNotification(notificationId: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  playNotificationSound(): Promise<void>;
  vibrateDevice(): Promise<void>;
}

export interface INotificationPreferencesService {
  getPreferences(userId: string): Promise<NotificationPreferences>;
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  isQuietTime(): boolean;
  shouldNotifyForType(type: NotificationType, preferences: NotificationPreferences): boolean;
}

export interface INotificationRepository {
  getNotifications(userId: string, limit?: number): Promise<NotificationData[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

// DTOs para requisições
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  reservationId?: string;
}

export interface UpdateNotificationPreferencesRequest {
  statusChanges?: boolean;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
  pushEnabled?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}