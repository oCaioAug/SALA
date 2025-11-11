"use client";

import {
  ArrowLeft,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { ReservationForm } from "@/components/forms/ReservationForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { ReservationWithUser, Room, User } from "@/lib/types";

const RoomSchedulesPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [currentPage, setCurrentPage] = useState("salas");
  const [room, setRoom] = useState<Room | null>(null);
  const [reservations, setReservations] = useState<ReservationWithUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [createReservationLoading, setCreateReservationLoading] =
    useState(false);

  const { showSuccess, showError } = useApp();

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Carregar dados da sala e reservas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar dados da sala
        const roomResponse = await fetch(`/api/rooms/${roomId}`);
        if (!roomResponse.ok) {
          throw new Error("Sala não encontrada");
        }
        const roomData = await roomResponse.json();
        setRoom(roomData);

        // Carregar reservas da sala e usuários
        const [reservationsResponse, usersResponse] = await Promise.all([
          fetch(`/api/reservations?roomId=${roomId}`),
          fetch("/api/users").catch(() => null),
        ]);

        if (!reservationsResponse.ok) {
          throw new Error("Erro ao carregar reservas");
        }

        const [reservationsData, usersData] = await Promise.all([
          reservationsResponse.json(),
          usersResponse?.ok ? usersResponse.json() : Promise.resolve([]),
        ]);

        setReservations(reservationsData);
        setUsers(usersData || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchData();
    }
  }, [roomId, showError]);

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch =
      (reservation.user.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reservation.purpose || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleReservationClick = (reservation: ReservationWithUser) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleCreateReservation = () => {
    setIsCreateModalOpen(true);
  };

  const handleSubmitReservation = async (reservationData: {
    userId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  }) => {
    try {
      setCreateReservationLoading(true);

      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar reserva");
      }

      const newReservation = await response.json();

      // Atualizar lista de reservas
      setReservations(prev => [newReservation, ...prev]);

      // Fechar modal
      setIsCreateModalOpen(false);

      // Mostrar sucesso
      showSuccess("Reserva criada com sucesso!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao criar reserva";
      showError(errorMessage);
    } finally {
      setCreateReservationLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao cancelar reserva");
      }

      setReservations(prev => prev.filter(r => r.id !== reservationId));
      showSuccess("Reserva cancelada com sucesso!");
      setIsDetailsModalOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao cancelar reserva";
      showError(errorMessage);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "text-green-400 bg-green-500/10";
      case "CANCELLED":
        return "text-red-400 bg-red-500/10";
      case "COMPLETED":
        return "text-blue-400 bg-blue-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "Ativa";
      case "CANCELLED":
        return "Cancelada";
      case "COMPLETED":
        return "Concluída";
      default:
        return "Desconhecido";
    }
  };

  const groupReservationsByDate = (reservations: ReservationWithUser[]) => {
    const grouped: { [key: string]: ReservationWithUser[] } = {};

    reservations.forEach(reservation => {
      const date = new Date(reservation.startTime);
      const dateKey = date.toISOString().split("T")[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(reservation);
    });

    // Ordenar por data
    return Object.keys(grouped)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = grouped[key].sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          return result;
        },
        {} as { [key: string]: ReservationWithUser[] }
      );
  };

  const groupedReservations = groupReservationsByDate(filteredReservations);

  if (loading) {
    return <LoadingPage message="Carregando agendamentos..." />;
  }

  if (error || !room) {
    return (
      <ErrorPage
        error={error || "Sala não encontrada"}
        onRetry={() => router.back()}
        retryLabel="Voltar"
      />
    );
  }

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
    >
      {/* Header da página */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
              <CalendarIcon className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Agendamentos - {room.name}
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                {reservations.length} reserva(s) encontrada(s) para esta sala
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-slate-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-l-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-3 rounded-r-lg transition-colors ${
                  viewMode === "calendar"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Calendário
              </button>
            </div>

            <Button onClick={handleCreateReservation} className="px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuário ou propósito..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="ACTIVE">Ativas</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="COMPLETED">Concluídas</option>
        </select>
      </div>

      {/* Conteúdo principal */}
      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={
            <CalendarIcon className="w-8 h-8 text-slate-500 dark:text-gray-400" />
          }
          title="Nenhuma reserva encontrada"
          description={
            searchTerm || statusFilter !== "all"
              ? "Tente ajustar os filtros de busca para encontrar reservas."
              : "Esta sala ainda não possui agendamentos."
          }
          action={
            searchTerm || statusFilter !== "all"
              ? undefined
              : {
                  label: "Criar Primeira Reserva",
                  onClick: handleCreateReservation,
                }
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedReservations).map(
            ([dateKey, dayReservations]) => (
              <Card key={dateKey} variant="elevated">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <CardTitle className="text-xl">
                        {formatDate(new Date(dateKey))}
                      </CardTitle>
                      <CardDescription>
                        {dayReservations.length} reserva(s) neste dia
                      </CardDescription>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {dayReservations.map(reservation => (
                      <div
                        key={reservation.id}
                        className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                        onClick={() => handleReservationClick(reservation)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <UserIcon className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {reservation.user.name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDateTime(
                                    new Date(reservation.startTime)
                                  )}{" "}
                                  -{" "}
                                  {formatDateTime(
                                    new Date(reservation.endTime)
                                  )}
                                </div>
                              </div>
                              {reservation.purpose && (
                                <p className="text-sm text-slate-700 dark:text-gray-300 mt-1">
                                  {reservation.purpose}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                            >
                              {getStatusText(reservation.status)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleReservationClick(reservation);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Modal de detalhes da reserva */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes da Reserva"
      >
        {selectedReservation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Sala
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-900 dark:text-white">
                    {room.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Usuário
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <UserIcon className="w-4 h-4 text-green-400" />
                  <span className="text-slate-900 dark:text-white">
                    {selectedReservation.user.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Início
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-900 dark:text-white">
                    {formatDateTime(new Date(selectedReservation.startTime))}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Fim
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-slate-900 dark:text-white">
                    {formatDateTime(new Date(selectedReservation.endTime))}
                  </span>
                </div>
              </div>
            </div>

            {selectedReservation.purpose && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Propósito
                </label>
                <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                  {selectedReservation.purpose}
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                Status
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReservation.status)}`}
              >
                {getStatusText(selectedReservation.status)}
              </span>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              {selectedReservation.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleDeleteReservation(selectedReservation.id)
                  }
                  className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Reserva
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para criar reserva */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Reserva"
        size="lg"
      >
        <ReservationForm
          rooms={room ? [room] : []}
          users={users}
          selectedRoomId={roomId}
          onSubmit={handleSubmitReservation}
          onCancel={() => setIsCreateModalOpen(false)}
          loading={createReservationLoading}
        />
      </Modal>
    </PageLayout>
  );
};

export default RoomSchedulesPage;
