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
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { ReservationForm } from "@/components/forms/ReservationForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { ReservationWithUser, Room, User } from "@/lib/types";
import { getIntlLocale } from "@/lib/utils";

const RoomSchedulesPage: React.FC = () => {
  const t = useTranslations("SchedulesPage");
  const { fromPayload } = useApiErrorMessage();
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
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
  const [selectedDate, setSelectedDate] = useState(new Date());
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
          throw new Error(t("unknownRoom"));
        }
        const roomData = await roomResponse.json();
        setRoom(roomData);

        // Carregar reservas da sala e usuários
        const [reservationsResponse, usersResponse] = await Promise.all([
          fetch(`/api/reservations?roomId=${roomId}`),
          fetch("/api/users").catch(() => null),
        ]);

        if (!reservationsResponse.ok) {
          throw new Error(t("error.reservationCreation"));
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
          err instanceof Error ? err.message : t("statusFilter.unknown");
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

  const getReservationsForDate = (date: Date): ReservationWithUser[] => {
    return filteredReservations.filter(reservation => {
      const startDate = new Date(reservation.startTime);
      const endDate = new Date(reservation.endTime);
      const checkDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayReservations = getReservationsForDate(date);
    if (dayReservations.length > 0) {
      setSelectedReservation(dayReservations[0]);
      setIsDetailsModalOpen(true);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clicked = new Date(date);
    clicked.setHours(0, 0, 0, 0);
    if (clicked.getTime() < today.getTime()) return;

    setIsCreateModalOpen(true);
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
        throw new Error(
          fromPayload(errorData) || t("error.reservationCreation")
        );
      }

      const responseData = await response.json();

      // Se for reserva recorrente, adicionar todas as instâncias
      if (responseData.isRecurring && responseData.reservations) {
        setReservations(prev => [...responseData.reservations, ...prev]);
      } else {
        // Reserva única
        setReservations(prev => [responseData, ...prev]);
      }

      // Fechar modal
      setIsCreateModalOpen(false);

      // Mostrar sucesso
      showSuccess(t("success.reservationCreated"));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("error.reservationCreation");
      showError(errorMessage);
    } finally {
      setCreateReservationLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm(t("confirmations.deleteReservation"))) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("error.reservationCancellation"));
      }

      setReservations(prev => prev.filter(r => r.id !== reservationId));
      showSuccess(t("success.reservationCancelled"));
      setIsDetailsModalOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("error.reservationCancellation");
      showError(errorMessage);
    }
  };

  const formatDateTime = (date: Date): string => {
    // Converter locale do next-intl para formato do Intl
    const intlLocale = getIntlLocale(locale);

    return date.toLocaleString(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date): string => {
    // Converter locale do next-intl para formato do Intl
    const intlLocale = getIntlLocale(locale);

    return date.toLocaleDateString(intlLocale, {
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
        return t("statusFilter.active");
      case "CANCELLED":
        return t("statusFilter.cancelled");
      case "COMPLETED":
        return t("statusFilter.completed");
      default:
        return t("statusFilter.unknown");
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

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
    >
      {loading ? (
        <LoadingPage variant="embedded" message={t("loading")} />
      ) : error || !room ? (
        <ErrorPage
          variant="embedded"
          error={error || t("unknownRoom")}
          onRetry={() => router.back()}
          retryLabel={t("roomContext.back")}
        />
      ) : (
        <>
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("roomContext.back")}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-foreground sm:text-2xl mb-2">
                    {t("roomTitle", { name: room.name })}
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400">
                    {t("roomReservationsFound", { count: reservations.length })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`px-4 text-sm font-medium transition-colors ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {t("roomContext.listView")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("calendar")}
                    className={`px-4 text-sm font-medium transition-colors ${
                      viewMode === "calendar"
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                    }`}
                  >
                    {t("roomContext.calendarView")}
                  </button>
                </div>

                <Button
                  onClick={handleCreateReservation}
                  className="inline-flex h-11 items-center px-6"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t("newReservation")}
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
                placeholder={t("roomContext.searchPlaceholder")}
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
              <option value="all">{t("roomContext.statusAll")}</option>
              <option value="ACTIVE">{t("statusFilter.active")}</option>
              <option value="CANCELLED">{t("statusFilter.cancelled")}</option>
              <option value="COMPLETED">{t("statusFilter.completed")}</option>
            </select>
          </div>

          {/* Conteúdo principal */}
          {viewMode === "calendar" ? (
            <div className="mt-6">
              <Calendar
                reservations={filteredReservations}
                rooms={room ? [room] : []}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onDateClick={handleDateClick}
                onReservationClick={handleReservationClick}
              />
            </div>
          ) : filteredReservations.length === 0 ? (
            <EmptyState
              icon={
                <CalendarIcon className="w-8 h-8 text-slate-500 dark:text-gray-400" />
              }
              title={t("noReservationsForTheDay")}
              description={
                searchTerm || statusFilter !== "all"
                  ? t("roomContext.emptyFiltered")
                  : t("roomContext.emptyRoom")
              }
              action={
                searchTerm || statusFilter !== "all"
                  ? undefined
                  : {
                      label: t("roomContext.createFirst"),
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
                            {t("roomContext.reservationsOnDay", {
                              count: dayReservations.length,
                            })}
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
          <Drawer
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            title={t("modal.details")}
          >
            {selectedReservation && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                      {t("room")}
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
                      {t("user")}
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
                      {t("start")}
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-slate-900 dark:text-white">
                        {formatDateTime(
                          new Date(selectedReservation.startTime)
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                      {t("end")}
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
                      {t("purpose")}
                    </label>
                    <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                      {selectedReservation.purpose}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    {t("status")}
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
                    {t("close")}
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
                      {t("cancelReservation")}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Drawer>

          <Drawer
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title={t("modal.create")}
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
          </Drawer>
        </>
      )}
    </PageLayout>
  );
};

export default RoomSchedulesPage;
