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
  X,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Notification,
  NOTIFICATION_TYPE_CONFIG,
  NotificationTypeType,
} from "@/lib/types";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { cn, getIntlLocale } from "@/lib/utils";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onNotificationChange?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userId,
  onNotificationChange,
  onNotificationClick,
}) => {
  const t = useTranslations("NotificationModal");
  const tCommon = useTranslations("Common");
  const tNotificationService = useTranslations("NotificationService");
  const { fromPayload } = useApiErrorMessage();
  const locale = useLocale();
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
        throw new Error(t("loadError"));
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
      setError(
        err instanceof Error ? err.message : fromPayload({}) || t("loadError")
      );
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
        throw new Error(t("errors.markAsRead"));
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
        throw new Error(t("errors.delete"));
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
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(t("errors.markAllAsRead"));
      }

      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));

      if (onNotificationChange) {
        onNotificationChange();
      }
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
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

  // Função para traduzir títulos das notificações baseado no tipo
  const getNotificationTitle = (notification: Notification): string => {
    switch (notification.type) {
      case "RESERVATION_CREATED":
        return tNotificationService("titles.reservationCreated");
      case "RESERVATION_APPROVED":
        return tNotificationService("titles.reservationApproved");
      case "RESERVATION_REJECTED":
        return tNotificationService("titles.reservationRejected");
      case "RESERVATION_CANCELLED":
        return tNotificationService("titles.reservationCancelled");
      case "SYSTEM_ANNOUNCEMENT":
      case "RESERVATION_CONFLICT":
      case "ROOM_STATUS_CHANGED":
      default:
        // Para outros tipos, usar o título armazenado no banco como fallback
        return notification.title;
    }
  };

  // Função para traduzir mensagens das notificações baseado no tipo
  const getNotificationMessage = (notification: Notification): string => {
    const intlLocale = getIntlLocale(locale);

    // Parse dos dados da notificação
    let notificationData: any = {};
    if (notification.data) {
      if (typeof notification.data === "string") {
        try {
          notificationData = JSON.parse(notification.data);
        } catch {
          notificationData = {};
        }
      } else {
        notificationData = notification.data;
      }
    }

    switch (notification.type) {
      case "RESERVATION_CREATED": {
        const userName = notificationData.userName || tCommon("user");
        const roomName = notificationData.roomName || "";
        const startTime = notificationData.startTime
          ? new Date(notificationData.startTime).toLocaleString(intlLocale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        const purpose = notificationData.purpose
          ? tNotificationService("messages.purposePrefix", {
              purpose: notificationData.purpose,
            })
          : "";

        // Verificar se o usuário que criou é admin
        const isAdmin =
          notificationData.isAdmin || notificationData.userRole === "ADMIN";

        if (isAdmin) {
          return tNotificationService("messages.reservationCreatedAdmin", {
            userName,
            roomName,
            startTime,
            purpose,
          });
        } else {
          return tNotificationService("messages.reservationCreatedUser", {
            userName,
            roomName,
            startTime,
            purpose,
          });
        }
      }
      case "RESERVATION_APPROVED": {
        const roomName = notificationData.roomName || "";
        const startTime = notificationData.startTime
          ? new Date(notificationData.startTime).toLocaleString(intlLocale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return tNotificationService("messages.reservationApproved", {
          roomName,
          startTime,
        });
      }
      case "RESERVATION_REJECTED": {
        const roomName = notificationData.roomName || "";
        const startTime = notificationData.startTime
          ? new Date(notificationData.startTime).toLocaleString(intlLocale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";
        const reason = notificationData.reason
          ? tNotificationService("messages.reasonPrefix", {
              reason: notificationData.reason,
            })
          : "";

        return tNotificationService("messages.reservationRejected", {
          roomName,
          startTime,
          reason,
        });
      }
      case "RESERVATION_CANCELLED": {
        const roomName = notificationData.roomName || "";

        return tNotificationService("messages.reservationCancelled", {
          roomName,
        });
      }
      case "SYSTEM_ANNOUNCEMENT":
      case "RESERVATION_CONFLICT":
      case "ROOM_STATUS_CHANGED":
      default:
        // Para outros tipos, usar a mensagem armazenada no banco como fallback
        return notification.message;
    }
  };

  const getNotificationColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-500/15 text-blue-700 ring-blue-500/25 dark:text-blue-300",
      green:
        "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300",
      red: "bg-rose-500/15 text-rose-800 ring-rose-500/25 dark:text-rose-300",
      orange:
        "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200",
      purple:
        "bg-violet-500/15 text-violet-800 ring-violet-500/25 dark:text-violet-300",
      gray: "bg-slate-500/15 text-slate-700 ring-slate-500/20 dark:text-slate-300",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return t("timeAgo.justNow");
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t("timeAgo.hoursAgo", { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return t("timeAgo.daysAgo", { count: diffInDays });
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  const summaryText =
    notifications.length === 0
      ? null
      : unreadCount > 0
        ? t("notifications.unreadCount", {
            unread: unreadCount,
            total: notifications.length,
            plural: unreadCount > 1 ? "s" : "",
          })
        : t("notifications.allRead", { total: notifications.length });

  return (
    <div className="fixed top-[4.5rem] right-3 z-[9999] flex w-[min(calc(100vw-1.5rem),22rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:right-6 sm:w-96">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
              <Bell className="h-4 w-4" aria-hidden />
            </span>
            <h3 className="truncate text-base font-semibold text-foreground">
              {t("title")}
            </h3>
            {unreadCount > 0 ? (
              <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("a11y.close")}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {summaryText ? (
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{summaryText}</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-blue-600 dark:hover:text-blue-400"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                {t("actions.markAllAsRead")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-4">
            <EmptyState
              icon={<Bell className="h-8 w-8 text-muted-foreground" />}
              title={t("errors.load")}
              description={error}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<Bell className="h-8 w-8 text-muted-foreground" />}
              title={t("notifications.none")}
              description={t("noneDescription")}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border p-2" role="list">
            {notifications.map(notification => {
              const IconComponent = getNotificationIcon(
                notification.type as NotificationTypeType
              );
              const color = getNotificationColor(
                notification.type as NotificationTypeType
              );
              const colorClasses = getNotificationColorClasses(color);

              return (
                <li key={notification.id}>
                  <article
                    role="button"
                    tabIndex={0}
                    onClick={() => onNotificationClick?.(notification)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onNotificationClick?.(notification);
                      }
                    }}
                    className={cn(
                      "group relative rounded-lg p-3 transition-colors",
                      notification.isRead
                        ? "hover:bg-muted/40"
                        : "bg-blue-500/5 hover:bg-blue-500/10"
                    )}
                  >
                    {!notification.isRead ? (
                      <span
                        className="absolute left-1 top-5 h-1.5 w-1.5 rounded-full bg-blue-500"
                        aria-hidden
                      />
                    ) : null}

                    <div className="flex items-start gap-3 pl-1.5">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                          colorClasses
                        )}
                      >
                        <IconComponent className="h-4 w-4" aria-hidden />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={cn(
                                "text-sm font-semibold leading-snug",
                                notification.isRead
                                  ? "text-foreground/80"
                                  : "text-foreground"
                              )}
                            >
                              {getNotificationTitle(notification)}
                            </h4>
                            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                              {getNotificationMessage(notification)}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" aria-hidden />
                              <time dateTime={new Date(notification.createdAt).toISOString()}>
                                {formatDate(notification.createdAt)}
                              </time>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            {!notification.isRead ? (
                              <Button
                                onClick={e => {
                                  e.stopPropagation();
                                  void markAsRead(notification.id);
                                }}
                                variant="ghost"
                                size="sm"
                                disabled={markingAsRead === notification.id}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                                aria-label={t("actions.markAsRead")}
                              >
                                {markingAsRead === notification.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            ) : null}

                            <Button
                              onClick={e => {
                                e.stopPropagation();
                                void deleteNotification(notification.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                              aria-label={t("actions.delete")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export { NotificationModal };
