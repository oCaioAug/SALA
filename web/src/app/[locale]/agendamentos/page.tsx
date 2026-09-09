"use client";

import {
  Calendar as CalendarIcon,
  Plus,
  Search,
} from "lucide-react";
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
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { ReservationWithUser, Room, User } from "@/lib/types";
import { getIntlLocale } from "@/lib/utils";

const AgendamentosPage: React.FC = () => {
  const t = useTranslations("SchedulesPage");
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState("agendamentos");
  const [reservations, setReservations] = useState<ReservationWithUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationWithUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createReservationLoading, setCreateReservationLoading] =
    useState(false);
  const [dayPage, setDayPage] = useState(1);
  const [dayPageSize, setDayPageSize] = useState(12);

  const { showSuccess, showError } = useApp();

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reservationsResponse, roomsResponse, usersResponse] =
          await Promise.all([
            fetch("/api/reservations"),
            fetch("/api/rooms"),
            fetch("/api/users").catch(() => null), // API de usuários pode não existir ainda
          ]);

        if (!reservationsResponse.ok || !roomsResponse.ok) {
          throw new Error("Erro ao carregar dados");
        }

        const [reservationsData, roomsData, usersData] = await Promise.all([
          reservationsResponse.json(),
          roomsResponse.json(),
          usersResponse?.ok ? usersResponse.json() : Promise.resolve([]),
        ]);

        setReservations(reservationsData);
        setRooms(roomsData);
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

    fetchData();
  }, []);

  const filteredReservations = reservations.filter(reservation => {
    const roomName = rooms.find(r => r.id === reservation.roomId)?.name || "";
    const matchesSearch =
      (reservation.user.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.purpose || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getReservationsForDate = (date: Date): ReservationWithUser[] => {
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.startTime);
      const endDate = new Date(reservation.endTime);
      const checkDate = new Date(date);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const filteredIds = new Set(filteredReservations.map(r => r.id));
  const reservationsForSelectedDay = getReservationsForDate(
    selectedDate
  ).filter(r => filteredIds.has(r.id));
  const totalDayReservations = reservationsForSelectedDay.length;
  const totalDayPages = Math.max(
    1,
    Math.ceil(totalDayReservations / dayPageSize)
  );
  const safeDayPage = Math.min(dayPage, totalDayPages);
  const paginatedDayReservations = reservationsForSelectedDay.slice(
    (safeDayPage - 1) * dayPageSize,
    safeDayPage * dayPageSize
  );

  useEffect(() => {
    setDayPage(1);
  }, [selectedDate, searchTerm, statusFilter]);

  const handleReservationClick = (reservation: ReservationWithUser) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
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
    // Empty past days: do not open create
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
        throw new Error(errorData.error || "Erro ao criar reserva");
      }

      const responseData = await response.json();

      // Se for reserva recorrente, adicionar todas as instâncias
      if (responseData.isRecurring && responseData.reservations) {
        console.log(
          ` Adicionando ${responseData.reservations.length} reservas recorrentes ao estado`
        );
        setReservations(prev => [...responseData.reservations, ...prev]);
        showSuccess(
          t("success.reservationCreated") +
            ` (${responseData.reservations.length} ${t("recurringInstances") || "instâncias"})`
        );
      } else {
        // Reserva única
        setReservations(prev => [responseData, ...prev]);
        showSuccess(t("success.reservationCreated"));
      }

      // Fechar modal
      setIsCreateModalOpen(false);
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
        throw new Error("Erro ao cancelar reserva");
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

  const getStatusText = (status: string): string => {
    switch (status) {
      case "PENDING":
        return t("statusFilter.pending");
      case "APPROVED":
        return t("statusFilter.approved");
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

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
    >
      {loading ? (
        <LoadingPage variant="embedded" message={t("loading")} />
      ) : error ? (
        <ErrorPage
          variant="embedded"
          error={error}
          onRetry={() => window.location.reload()}
          retryLabel={t("retryLabel")}
        />
      ) : (
        <>
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-foreground sm:text-2xl mb-2">
                    {t("title")}
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400">
                    {t("description")}
                  </p>
                </div>
              </div>

              <Button onClick={handleCreateReservation} className="px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                {t("newReservation")}
              </Button>
            </div>

            {/* Filtros e busca */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-500 dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
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
                <option value="all">{t("statusFilter.all")}</option>
                <option value="PENDING">{t("statusFilter.pending")}</option>
                <option value="APPROVED">{t("statusFilter.approved")}</option>
                <option value="ACTIVE">{t("statusFilter.active")}</option>
                <option value="CANCELLED">{t("statusFilter.cancelled")}</option>
                <option value="COMPLETED">{t("statusFilter.completed")}</option>
              </select>
            </div>
          </div>

          {/* Calendário */}
          <div className="mb-8">
            <Calendar
              reservations={reservations}
              rooms={rooms}
              onReservationClick={handleReservationClick}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Lista de reservas do dia selecionado */}
          <Card variant="elevated" className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
              <div className="min-w-0">
                <CardTitle className="text-lg capitalize">
                  {t("reservationsOfTheDay")}{" "}
                  {selectedDate.toLocaleDateString(getIntlLocale(locale), {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </CardTitle>
                <CardDescription className="mt-1">
                  {totalDayReservations} {t("reservationsFound")}
                </CardDescription>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {totalDayReservations}
              </span>
            </div>

            <CardContent className="p-4 sm:p-6">
              {totalDayReservations === 0 ? (
                <EmptyState
                  icon={
                    <CalendarIcon className="h-8 w-8 text-slate-500 dark:text-gray-400" />
                  }
                  title={t("noReservationsForTheDay")}
                  description={t("noReservationsForTheDayDescription")}
                />
              ) : (
                <div className="space-y-3">
                  {paginatedDayReservations.map(reservation => (
                    <ReservationListItem
                      key={reservation.id}
                      title={
                        rooms.find(r => r.id === reservation.roomId)?.name ||
                        t("unknownRoom")
                      }
                      userName={reservation.user.name}
                      startTime={new Date(reservation.startTime)}
                      endTime={new Date(reservation.endTime)}
                      purpose={reservation.purpose}
                      status={reservation.status}
                      statusLabel={getStatusText(reservation.status)}
                      onClick={() => handleReservationClick(reservation)}
                      formatDateTime={formatDateTime}
                    />
                  ))}
                  <div className="border-t border-border pt-4">
                    <Pagination
                      page={safeDayPage}
                      pageSize={dayPageSize}
                      total={totalDayReservations}
                      onPageChange={setDayPage}
                      onPageSizeChange={size => {
                        setDayPageSize(size);
                        setDayPage(1);
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <ReservationDetailsDrawer
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            reservation={selectedReservation}
            roomName={
              rooms.find(r => r.id === selectedReservation?.roomId)?.name ||
              t("unknownRoom")
            }
            canCancel={
              selectedReservation?.status === "ACTIVE" ||
              selectedReservation?.status === "APPROVED"
            }
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
              rooms={rooms}
              users={users}
              selectedDate={selectedDate}
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

export default AgendamentosPage;
