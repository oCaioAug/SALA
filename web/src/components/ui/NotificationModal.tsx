"use client";

import {
  AlertTriangle,
  Bell,
  Building,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  Megaphone,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Notification,
  NOTIFICATION_TYPE_CONFIG,
  NotificationTypeType,
} from "@/lib/types";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onNotificationChange?: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userId,
  onNotificationChange,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/notifications?userId=${userId}&limit=50`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar notificações");
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar como lida");
      }

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      // Notificar mudança
      if (onNotificationChange) {
        onNotificationChange();
      }
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar notificação");
      }

      // Remover do estado local
      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );

      // Notificar mudança
      if (onNotificationChange) {
        onNotificationChange();
      }
    } catch (err) {
      console.error("Erro ao deletar notificação:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log("🔄 Marcando todas como lidas para userId:", userId);

      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      console.log("📡 Resposta da API:", response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro da API:", errorData);
        throw new Error("Erro ao marcar todas como lidas");
      }

      const result = await response.json();
      console.log("✅ Resultado da API:", result);

      // Atualizar estado local
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));

      console.log("🔄 Chamando onNotificationChange...");
      // Notificar mudança
      if (onNotificationChange) {
        onNotificationChange();
        console.log("✅ onNotificationChange chamado");
      } else {
        console.log("❌ onNotificationChange não definido");
      }
    } catch (err) {
      console.error("❌ Erro ao marcar todas como lidas:", err);
    }
  };

  const getNotificationIcon = (type: NotificationTypeType) => {
    const iconMap = {
      RESERVATION_CREATED: CalendarPlus,
      RESERVATION_APPROVED: CheckCircle,
      RESERVATION_REJECTED: XCircle,
      RESERVATION_CANCELLED: CalendarX,
      RESERVATION_CONFLICT: AlertTriangle,
      ROOM_STATUS_CHANGED: Building,
      SYSTEM_ANNOUNCEMENT: Megaphone,
    };

    const IconComponent = iconMap[type] || Bell;
    return IconComponent;
  };

  const getNotificationColor = (type: NotificationTypeType) => {
    const config = NOTIFICATION_TYPE_CONFIG[type];
    return config?.color || "gray";
  };

  const getNotificationColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-500/20 text-blue-400",
      green: "bg-green-500/20 text-green-400",
      red: "bg-red-500/20 text-red-400",
      orange: "bg-orange-500/20 text-orange-400",
      purple: "bg-purple-500/20 text-purple-400",
      gray: "bg-gray-500/20 text-gray-400",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Agora mesmo";
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-6 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600/50 rounded-xl shadow-2xl z-[9999999] max-h-96 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-600/50 bg-slate-50 dark:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Notificações
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600/50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {/* Header com ações */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-200 dark:border-slate-600/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {notifications.length} notificação
              {notifications.length !== 1 ? "ões" : ""}
              {unreadCount > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({unreadCount} não lida{unreadCount !== 1 ? "s" : ""})
                </span>
              )}
            </span>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Lista de notificações */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={
              <Bell className="w-8 h-8 text-slate-400 dark:text-gray-400" />
            }
            title="Erro ao carregar notificações"
            description={error}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={
              <Bell className="w-8 h-8 text-slate-400 dark:text-gray-400" />
            }
            title="Nenhuma notificação"
            description="Você não tem notificações no momento"
          />
        ) : (
          <div className="p-2">
            {notifications.map(notification => {
              const IconComponent = getNotificationIcon(
                notification.type as NotificationTypeType
              );
              const color = getNotificationColor(
                notification.type as NotificationTypeType
              );
              const colorClasses = getNotificationColorClasses(color);

              return (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 ${
                    notification.isRead
                      ? "bg-slate-50/50 dark:bg-slate-800/30"
                      : "bg-blue-50 dark:bg-blue-500/10 border-l-2 border-blue-500"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${colorClasses.split(" ")[0]}`}
                    >
                      <IconComponent
                        className={`w-4 h-4 ${colorClasses.split(" ")[1]}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4
                            className={`font-medium text-sm ${
                              notification.isRead
                                ? "text-slate-700 dark:text-slate-300"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <p
                            className={`text-xs mt-1 ${
                              notification.isRead
                                ? "text-slate-600 dark:text-slate-400"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-slate-500 dark:text-slate-500" />
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDate(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              disabled={markingAsRead === notification.id}
                              className="text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 p-1"
                            >
                              {markingAsRead === notification.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                          )}

                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { NotificationModal };
