"use client";

import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle,
  Clock,
  Filter,
  Info,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";

import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";

interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "SYSTEM_ANNOUNCEMENT"
    | "RESERVATION_CREATED"
    | "RESERVATION_APPROVED"
    | "RESERVATION_REJECTED"
    | "RESERVATION_CANCELLED"
    | "RESERVATION_REMINDER";
  isRead: boolean;
  createdAt: string;
  userId: string;
  data?: any; // Campo para dados adicionais da notificação
}

const NotificationPage: React.FC = () => {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState("notificacoes");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [notificationUpdateTrigger, setNotificationUpdateTrigger] = useState(0);

  const { showSuccess, showError } = useApp();
  const { handleNotificationClick: globalNotificationHandler } =
    useNotificationHandler();

  // Hook de navegação
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: session.user.email,
        limit: "50",
      });

      if (filter !== "all") {
        params.append("isRead", filter === "read" ? "true" : "false");
      }

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar notificações");
      }

      const data = await response.json();
      console.log("📨 Notificações recebidas:", data);
      console.log("📊 Filtros aplicados:", { filter, typeFilter });
      console.log("👤 Usuário logado:", session?.user?.email);

      // A API retorna as notificações diretamente, não em data.notifications
      const notificationsList = Array.isArray(data) ? data : [];
      console.log("📋 Total de notificações:", notificationsList.length);

      setNotifications(notificationsList);
    } catch (err) {
      console.error("Erro ao buscar notificações:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar notificações";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, filter, typeFilter, showError]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchNotifications();
    }
  }, [session?.user?.email, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar notificação como lida");
      }

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      showSuccess("Notificação marcada como lida");
      triggerNotificationUpdate(); // Atualizar contador do header
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
      showError("Erro ao marcar notificação como lida");
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: session?.user?.email }),
      });

      if (!response.ok) {
        throw new Error("Erro ao marcar todas as notificações como lidas");
      }

      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      showSuccess("Todas as notificações foram marcadas como lidas");
      triggerNotificationUpdate(); // Atualizar contador do header
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      showError("Erro ao marcar todas as notificações como lidas");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SYSTEM_ANNOUNCEMENT":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "RESERVATION_CREATED":
        return <Bell className="w-5 h-5 text-purple-500" />;
      case "RESERVATION_APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "RESERVATION_REJECTED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "RESERVATION_CANCELLED":
        return <XCircle className="w-5 h-5 text-orange-500" />;
      case "RESERVATION_REMINDER":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "SYSTEM_ANNOUNCEMENT":
        return "Anúncio do Sistema";
      case "RESERVATION_CREATED":
        return "Nova Reserva";
      case "RESERVATION_APPROVED":
        return "Reserva Aprovada";
      case "RESERVATION_REJECTED":
        return "Reserva Rejeitada";
      case "RESERVATION_CANCELLED":
        return "Reserva Cancelada";
      case "RESERVATION_REMINDER":
        return "Lembrete de Reserva";
      default:
        return "Notificação";
    }
  };

  // Formatação de data melhorada
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Agora há pouco";
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else if (diffInHours < 48) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    globalNotificationHandler(notification);
  };

  const triggerNotificationUpdate = () => {
    setNotificationUpdateTrigger(Date.now());
  };

  // Função para obter cor do ícone baseada no tipo
  const getNotificationBorderColor = (type: string, isRead: boolean) => {
    if (isRead) return "border-slate-200 dark:border-slate-700";

    switch (type) {
      case "SYSTEM_ANNOUNCEMENT":
        return "border-blue-200 dark:border-blue-500/50";
      case "RESERVATION_CREATED":
        return "border-purple-200 dark:border-purple-500/50";
      case "RESERVATION_APPROVED":
        return "border-green-200 dark:border-green-500/50";
      case "RESERVATION_REJECTED":
        return "border-red-200 dark:border-red-500/50";
      case "RESERVATION_CANCELLED":
        return "border-orange-200 dark:border-orange-500/50";
      case "RESERVATION_REMINDER":
        return "border-yellow-200 dark:border-yellow-500/50";
      default:
        return "border-slate-200 dark:border-slate-700";
    }
  };
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <LoadingPage message="Carregando notificações..." />;
  }

  if (error) {
    return (
      <ErrorPage
        error={error}
        onRetry={() => fetchNotifications()}
        retryLabel="Tentar Novamente"
      />
    );
  }

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
      onNotificationItemClick={handleNotificationClick}
      notificationUpdateTrigger={notificationUpdateTrigger}
    >
      {/* Header da página */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
              <Bell className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Notificações
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                {unreadCount > 0
                  ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""} de ${notifications.length} total`
                  : notifications.length > 0
                    ? `Todas as ${notifications.length} notificações foram lidas`
                    : "Nenhuma notificação recebida"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                console.log("🔄 Recarregando notificações...");
                fetchNotifications();
              }}
            >
              🔄 Recarregar
            </Button>
            {session?.user?.role === "ADMIN" && (
              <>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      console.log(
                        "🔍 Verificando todas as notificações no banco..."
                      );
                      const response = await fetch("/api/notifications/debug");

                      if (response.ok) {
                        const result = await response.json();
                        console.log("📊 Debug das notificações:", result);
                        showSuccess(
                          `📊 ${result.total} notificações encontradas no banco (veja o console)`
                        );
                      } else {
                        showError("Erro ao buscar debug");
                      }
                    } catch (error) {
                      console.error("❌ Erro no debug:", error);
                      showError("Erro ao buscar debug");
                    }
                  }}
                >
                  🔍 Debug
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        "/api/notifications/test-reservation",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                        }
                      );

                      if (response.ok) {
                        const result = await response.json();
                        showSuccess(`✅ ${result.message}`);
                        console.log("🧪 Resultado do teste:", result);
                        // Recarregar notificações
                        setTimeout(() => fetchNotifications(), 1000);
                      } else {
                        const errorData = await response
                          .json()
                          .catch(() => ({}));
                        console.error("❌ Erro na resposta:", errorData);
                        showError("Erro ao criar notificação de teste");
                      }
                    } catch (error) {
                      console.error("❌ Erro na requisição:", error);
                      showError("Erro ao criar notificação de teste");
                    }
                  }}
                >
                  🧪 Testar Notificação
                </Button>
              </>
            )}
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        {/* Estatísticas rápidas */}
        {notifications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {notifications.length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Total
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {unreadCount}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Não lidas
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {notifications.filter(n => n.isRead).length}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Lidas
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {
                      notifications.filter(
                        n => n.type === "RESERVATION_CREATED"
                      ).length
                    }
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Novas Reservas
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filtros melhorados */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500 dark:text-gray-400" />
            <select
              value={filter}
              onChange={e =>
                setFilter(e.target.value as "all" | "unread" | "read")
              }
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as notificações</option>
              <option value="unread">Não lidas ({unreadCount})</option>
              <option value="read">
                Lidas ({notifications.filter(n => n.isRead).length})
              </option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="SYSTEM_ANNOUNCEMENT">Anúncios do Sistema</option>
            <option value="RESERVATION_CREATED">Novas Reservas</option>
            <option value="RESERVATION_APPROVED">Reservas Aprovadas</option>
            <option value="RESERVATION_REJECTED">Reservas Rejeitadas</option>
            <option value="RESERVATION_CANCELLED">Reservas Canceladas</option>
            <option value="RESERVATION_REMINDER">Lembretes</option>
          </select>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <EmptyState
            icon={
              <Bell className="w-8 h-8 text-slate-500 dark:text-gray-400" />
            }
            title={
              filter === "unread"
                ? "Nenhuma notificação não lida"
                : filter === "read"
                  ? "Nenhuma notificação lida"
                  : "Nenhuma notificação encontrada"
            }
            description={
              filter === "unread"
                ? "Parabéns! Você leu todas as suas notificações."
                : filter === "read"
                  ? "Ainda não há notificações marcadas como lidas."
                  : typeFilter !== "all"
                    ? `Não há notificações do tipo "${getNotificationTypeLabel(typeFilter)}" para exibir.`
                    : "Você ainda não recebeu nenhuma notificação. Quando houver atualizações importantes, elas aparecerão aqui."
            }
          />
        ) : (
          notifications.map(notification => (
            <Card
              key={notification.id}
              variant="elevated"
              hover
              className={`p-6 transition-all duration-200 cursor-pointer ${getNotificationBorderColor(notification.type, notification.isRead)} ${
                !notification.isRead
                  ? "bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-500/10 dark:to-transparent"
                  : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative">
                  {getNotificationIcon(notification.type)}
                  {!notification.isRead && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3
                          className={`font-semibold ${!notification.isRead ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-gray-300"}`}
                        >
                          {notification.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            notification.type === "SYSTEM_ANNOUNCEMENT"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                              : notification.type === "RESERVATION_CREATED"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                                : notification.type === "RESERVATION_APPROVED"
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                                  : notification.type === "RESERVATION_REJECTED"
                                    ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                                    : notification.type ===
                                        "RESERVATION_CANCELLED"
                                      ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                          }`}
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                      </div>

                      <p className="text-slate-700 dark:text-gray-300 mb-4 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Não lida
                          </span>
                        )}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="shrink-0"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageLayout>
  );
};

export default NotificationPage;
