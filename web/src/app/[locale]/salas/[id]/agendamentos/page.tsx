"use client";

import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Edit,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { ReservationForm } from "@/components/forms/ReservationForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { ReservationDetailsDrawer } from "@/components/reservations/ReservationDetailsDrawer";
import { ReservationListItem } from "@/components/reservations/ReservationListItem";
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
                  <Card key={dateKey} variant="elevated" className="overflow-hidden p-0">
                    <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
                      <div className="min-w-0">
                        <CardTitle className="text-lg capitalize">
                          {formatDate(new Date(dateKey))}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {t("roomContext.reservationsOnDay", {
                            count: dayReservations.length,
                          })}
                        </CardDescription>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                        {dayReservations.length}
                      </span>
                    </div>

                    <CardContent className="space-y-3 p-4 sm:p-6">
                      {dayReservations.map(reservation => (
                        <ReservationListItem
                          key={reservation.id}
                          title={reservation.user.name}
                          startTime={new Date(reservation.startTime)}
                          endTime={new Date(reservation.endTime)}
                          purpose={reservation.purpose}
                          status={reservation.status}
                          statusLabel={getStatusText(reservation.status)}
                          onClick={() => handleReservationClick(reservation)}
                          formatDateTime={formatDateTime}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          <ReservationDetailsDrawer
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            reservation={selectedReservation}
            roomName={room?.name || t("unknownRoom")}
            canCancel={selectedReservation?.status === "ACTIVE"}
            onCancel={() => {
              if (selectedReservation) {
                handleDeleteReservation(selectedReservation.id);
              }
            }}
            formatDateTime={formatDateTime}
          />

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
