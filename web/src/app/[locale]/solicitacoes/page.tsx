"use client";

import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  Network,
  Search,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import { SolicitacoesGuard } from "@/components/auth/SolicitacoesGuard";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { ReservationWithDetails, Room, User } from "@/lib/types";
import { getReservationStatusStyle } from "@/lib/reservations/status";
import { cn, getIntlLocale } from "@/lib/utils";

type ReservationWithSector = ReservationWithDetails & {
  room: Room & { sector?: { id: string; name: string } | null };
  decidedBy?: { id: string; name: string | null; email?: string } | null;
  decidedAt?: string | Date | null;
  decisionReason?: string | null;
};

type ScopeSector = {
  id: string;
  name: string;
  rooms?: { id: string }[];
  _count?: { rooms: number };
};

const SolicitacoesPage: React.FC = () => {
  const t = useTranslations("Solicitacoes");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const { data: session } = useSession();
  const { isOrgAdmin } = useOrgPermissions();
  const [currentPage, setCurrentPage] = useState("solicitacoes");
  const [solicitacoes, setSolicitacoes] = useState<ReservationWithSector[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [scopeSectors, setScopeSectors] = useState<ScopeSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitacao, setSelectedSolicitacao] =
    useState<ReservationWithSector | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [isRejectDrawerOpen, setIsRejectDrawerOpen] = useState(false);
  const [rejectTarget, setRejectTarget] =
    useState<ReservationWithDetails | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [focusedReservationId, setFocusedReservationId] = useState<
    string | null
  >(null);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(12);

  const { showSuccess, showError, showInfo } = useApp();
  const { handleNotificationClick: globalNotificationHandler } =
    useNotificationHandler();

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Verificar se há uma reserva para focar (vinda de notificação)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const focusReservation = urlParams.get("focusReservation");
    if (focusReservation) {
      setFocusedReservationId(focusReservation);
      // Remover o parâmetro da URL após usar
      urlParams.delete("focusReservation");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${urlParams.toString()}`
      );
    }
  }, []);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          solicitacoesResponse,
          roomsResponse,
          usersResponse,
          sectorsResponse,
        ] = await Promise.all([
          fetch("/api/reservations?status=PENDING"),
          fetch("/api/rooms"),
          fetch("/api/users").catch(() => null),
          fetch("/api/sectors").catch(() => null),
        ]);

        if (!solicitacoesResponse.ok) {
          const errorData = await solicitacoesResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              t("errors.httpStatus", {
                status: solicitacoesResponse.status,
                statusText: solicitacoesResponse.statusText,
              })
          );
        }

        if (!roomsResponse.ok) {
          throw new Error(t("errors.loadRooms"));
        }

        const [solicitacoesData, roomsData, usersData, sectorsData] =
          await Promise.all([
            solicitacoesResponse.json(),
            roomsResponse.json(),
            usersResponse?.ok ? usersResponse.json() : Promise.resolve([]),
            sectorsResponse?.ok ? sectorsResponse.json() : Promise.resolve([]),
          ]);

        // Agrupar reservas recorrentes para mostrar apenas uma por template
        const groupedRecurring = new Map<string, ReservationWithDetails[]>();
        const uniqueReservations: ReservationWithDetails[] = [];

        solicitacoesData.forEach((reservation: ReservationWithDetails) => {
          if (reservation.isRecurring && reservation.recurringTemplateId) {
            const templateId = reservation.recurringTemplateId;
            if (!groupedRecurring.has(templateId)) {
              groupedRecurring.set(templateId, []);
            }
            groupedRecurring.get(templateId)!.push(reservation);
          } else {
            uniqueReservations.push(reservation);
          }
        });

        // Adicionar apenas a primeira reserva de cada template recorrente
        groupedRecurring.forEach(reservations => {
          if (reservations.length > 0) {
            // Adicionar informação sobre quantas instâncias existem
            const firstReservation = reservations[0];
            (firstReservation as any).recurringInstancesCount =
              reservations.length;
            uniqueReservations.push(firstReservation);
          }
        });

        setSolicitacoes(uniqueReservations as ReservationWithSector[]);
        setRooms(roomsData);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setScopeSectors(Array.isArray(sectorsData) ? sectorsData : []);
      } catch (err) {
        console.error("Erro ao carregar solicitações:", err);
        const errorMessage =
          err instanceof Error ? err.message : t("errors.unknown");
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll para a reserva focada quando os dados carregarem
  useEffect(() => {
    if (focusedReservationId && !loading && solicitacoes.length > 0) {
      const element = document.getElementById(
        `solicitacao-${focusedReservationId}`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Remover o foco após 3 segundos
        setTimeout(() => setFocusedReservationId(null), 3000);
      }
    }
  }, [focusedReservationId, loading, solicitacoes]);

  const filteredSolicitacoes = solicitacoes.filter(solicitacao => {
    const roomName = rooms.find(r => r.id === solicitacao.roomId)?.name || "";
    const userName = solicitacao.user.name || "";
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (solicitacao.purpose || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || solicitacao.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setListPage(1);
  }, [searchTerm, statusFilter]);

  const totalFilteredSol = filteredSolicitacoes.length;
  const totalSolPages = Math.max(1, Math.ceil(totalFilteredSol / listPageSize));
  const safeSolPage = Math.min(listPage, totalSolPages);
  const paginatedSolicitacoes = filteredSolicitacoes.slice(
    (safeSolPage - 1) * listPageSize,
    safeSolPage * listPageSize
  );

  const handleSolicitacaoClick = (solicitacao: ReservationWithDetails) => {
    setSelectedSolicitacao(solicitacao);
    setIsDetailsModalOpen(true);
  };

  const checkForConflicts = async (solicitacao: ReservationWithDetails) => {
    try {
      const response = await fetch("/api/reservations/check-conflict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: solicitacao.roomId,
          startTime: solicitacao.startTime,
          endTime: solicitacao.endTime,
          excludeReservationId: solicitacao.id,
        }),
      });

      if (!response.ok) {
        throw new Error(t("errors.checkConflicts"));
      }

      const conflictData = await response.json();
      return conflictData;
    } catch (error) {
      console.error("Erro ao verificar conflitos:", error);
      return null;
    }
  };

  const isOwnRequest = (solicitacao: ReservationWithDetails) => {
    const myId = session?.user?.id;
    if (!myId) return false;
    return solicitacao.userId === myId || solicitacao.user?.id === myId;
  };

  const scopeBannerText = useMemo(() => {
    if (isOrgAdmin) return t("scope.org");
    const roomCount = scopeSectors.reduce((acc, sector) => {
      const fromRooms = sector.rooms?.length;
      const fromCount = sector._count?.rooms;
      return acc + (fromRooms ?? fromCount ?? 0);
    }, 0);
    if (scopeSectors.length === 0 || roomCount === 0) {
      return t("scope.managerEmpty");
    }
    return t("scope.manager", {
      sectors: scopeSectors.map(s => s.name).join(", "),
      count: roomCount,
    });
  }, [isOrgAdmin, scopeSectors, t]);

  const handleApprove = async (solicitacao: ReservationWithDetails) => {
    if (isOwnRequest(solicitacao)) {
      showError(t("card.selfApproveBlocked"));
      return;
    }
    try {
      setActionLoading(solicitacao.id);

      // Verificar conflitos antes de aprovar
      const conflicts = await checkForConflicts(solicitacao);

      if (conflicts && conflicts.hasConflict) {
        setConflictData({
          solicitacao,
          conflicts: conflicts.conflictingReservations,
          action: "approve",
        });
        setIsConflictModalOpen(true);
        return;
      }

      // Se não há conflitos, aprovar diretamente
      await approveSolicitacao(solicitacao.id);
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      showError(t("feedback.errorApprove"));
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDrawer = (solicitacao: ReservationWithDetails) => {
    if (isOwnRequest(solicitacao)) {
      showError(t("card.selfApproveBlocked"));
      return;
    }
    setRejectTarget(solicitacao);
    setRejectReason("");
    setIsRejectDrawerOpen(true);
  };

  const closeRejectDrawer = () => {
    setIsRejectDrawerOpen(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    try {
      setActionLoading(rejectTarget.id);
      const trimmed = rejectReason.trim();
      await rejectSolicitacao(rejectTarget.id, trimmed || undefined);
      closeRejectDrawer();
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      showError(t("feedback.errorReject"));
    } finally {
      setActionLoading(null);
    }
  };

  const approveSolicitacao = async (solicitacaoId: string) => {
    const response = await fetch("/api/reservations/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        reservationId: solicitacaoId,
        approved: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || t("errors.approve"));
    }

    const data = await response.json();

    // Remover todas as reservas relacionadas (se for recorrente, remove todas as instâncias)
    setSolicitacoes(prev => {
      const solicitacao = prev.find(s => s.id === solicitacaoId);
      if (solicitacao?.isRecurring && solicitacao?.recurringTemplateId) {
        // Remover todas as reservas com o mesmo template
        return prev.filter(
          s => s.recurringTemplateId !== solicitacao.recurringTemplateId
        );
      }
      return prev.filter(s => s.id !== solicitacaoId);
    });

    showSuccess(
      data.message ||
        t("feedback.successApprove") +
          (data.recurringInstances
            ? t("errors.instancesSuffix", {
                count: data.recurringInstances,
              })
            : "")
    );
    setIsDetailsModalOpen(false);
  };

  const rejectSolicitacao = async (solicitacaoId: string, reason?: string) => {
    const response = await fetch("/api/reservations/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        reservationId: solicitacaoId,
        approved: false,
        reason: reason || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || t("errors.reject"));
    }

    const data = await response.json();

    // Remover todas as reservas relacionadas (se for recorrente, remove todas as instâncias)
    setSolicitacoes(prev => {
      const solicitacao = prev.find(s => s.id === solicitacaoId);
      if (solicitacao?.isRecurring && solicitacao?.recurringTemplateId) {
        // Remover todas as reservas com o mesmo template
        return prev.filter(
          s => s.recurringTemplateId !== solicitacao.recurringTemplateId
        );
      }
      return prev.filter(s => s.id !== solicitacaoId);
    });

    showSuccess(
      data.message ||
        t("feedback.successReject") +
          (data.recurringInstances
            ? t("errors.instancesSuffix", {
                count: data.recurringInstances,
              })
            : "")
    );
    setIsDetailsModalOpen(false);
  };

  const handleForceApprove = async () => {
    if (!conflictData) return;

    try {
      setActionLoading(conflictData.solicitacao.id);

      // Cancelar reservas conflitantes
      for (const conflict of conflictData.conflicts) {
        await fetch(`/api/reservations/${conflict.id}`, {
          method: "DELETE",
        });
      }

      // Aprovar a nova solicitação
      await approveSolicitacao(conflictData.solicitacao.id);

      setIsConflictModalOpen(false);
      setConflictData(null);
      showInfo(t("feedback.forceApproveSuccess"));
    } catch (error) {
      console.error("Erro ao aprovar com conflito:", error);
      showError(t("feedback.errorForceApprove"));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (date: Date): string => {
    const intlLocale = getIntlLocale(locale);

    return date.toLocaleString(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatScheduleLabel = (start: Date, end: Date): string => {
    const intlLocale = getIntlLocale(locale);
    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
      const datePart = start.toLocaleString(intlLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const startTime = start.toLocaleString(intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      const endTime = end.toLocaleString(intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${datePart} · ${startTime} – ${endTime}`;
    }

    return `${formatDateTime(start)} – ${formatDateTime(end)}`;
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "PENDING":
        return t("card.pending");
      case "APPROVED":
        return t("card.approved");
      case "REJECTED":
        return t("card.rejected");
      default:
        return t("card.unknown");
    }
  };

  return (
    <SolicitacoesGuard>
      <PageLayout
        currentPage={currentPage}
        onNavigate={navigate}
        isNavigating={isNavigating}
        onNotificationClick={() => {}}
        onNotificationItemClick={globalNotificationHandler}
        notificationUpdateTrigger={0}
      >
        {loading ? (
          <LoadingPage variant="embedded" message={t("loading")} />
        ) : error ? (
          <ErrorPage
            variant="embedded"
            error={error}
            onRetry={() => window.location.reload()}
            retryLabel={tCommon("retry")}
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
                      {t("empty.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {solicitacoes.length}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {t("statusFilter.pending")}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                  isOrgAdmin
                    ? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                }`}
              >
                {scopeBannerText}
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
                  <option value="PENDING">{t("statusFilter.pending")}</option>
                  <option value="all">{t("statusFilter.all")}</option>
                  <option value="APPROVED">{t("statusFilter.approved")}</option>
                  <option value="REJECTED">{t("statusFilter.rejected")}</option>
                </select>
              </div>
            </div>

            {/* Lista de solicitações */}
            {filteredSolicitacoes.length === 0 ? (
              <EmptyState
                icon={
                  <ClipboardList className="w-8 h-8 text-slate-500 dark:text-gray-400" />
                }
                title={t("empty.title")}
                description={t("empty.description")}
              />
            ) : (
              <div className="space-y-3">
                {paginatedSolicitacoes.map(solicitacao => {
                  const roomName =
                    solicitacao.room?.name ||
                    rooms.find(r => r.id === solicitacao.roomId)?.name ||
                    t("unknownRoom");
                  const sectorName = solicitacao.room?.sector?.name;
                  const start = new Date(solicitacao.startTime);
                  const end = new Date(solicitacao.endTime);
                  const scheduleLabel = formatScheduleLabel(start, end);
                  const isFocused = focusedReservationId === solicitacao.id;
                  const isPending = solicitacao.status === "PENDING";
                  const ownRequest = isOwnRequest(solicitacao);
                  const isLoading = actionLoading === solicitacao.id;

                  return (
                    <Card
                      key={solicitacao.id}
                      variant="elevated"
                      className={cn(
                        "overflow-hidden transition-all",
                        isFocused &&
                          "border-blue-500/40 ring-2 ring-blue-500/30 dark:border-blue-500/50"
                      )}
                      id={`solicitacao-${solicitacao.id}`}
                    >
                      <CardContent className="p-0">
                        <div className="space-y-4 p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                              <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
                                {roomName}
                              </h3>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                                  getReservationStatusStyle(solicitacao.status)
                                )}
                              >
                                {getStatusText(solicitacao.status)}
                              </span>
                              {solicitacao.isRecurring &&
                              solicitacao.recurringTemplateId ? (
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {t("recurringInfo")}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSolicitacaoClick(solicitacao)
                                }
                                className="gap-1.5"
                              >
                                <Eye className="h-4 w-4" aria-hidden />
                                <span className="hidden sm:inline">
                                  {t("card.viewDetails")}
                                </span>
                              </Button>

                              {isPending && !ownRequest ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApprove(solicitacao)}
                                    disabled={isLoading}
                                    className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                  >
                                    {isLoading ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      <CheckCircle
                                        className="h-4 w-4"
                                        aria-hidden
                                      />
                                    )}
                                    <span className="hidden sm:inline">
                                      {t("card.approve")}
                                    </span>
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openRejectDrawer(solicitacao)}
                                    disabled={isLoading}
                                    className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                  >
                                    {isLoading ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      <XCircle
                                        className="h-4 w-4"
                                        aria-hidden
                                      />
                                    )}
                                    <span className="hidden sm:inline">
                                      {t("card.reject")}
                                    </span>
                                  </Button>
                                </>
                              ) : null}

                              {isPending && ownRequest ? (
                                <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-[14rem] sm:text-right">
                                  {t("card.selfApproveBlocked")}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="rounded-lg border border-border bg-muted/20 p-3.5 sm:p-4">
                            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                              {sectorName ? (
                                <div className="min-w-0">
                                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t("card.sector")}
                                  </dt>
                                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                    <Network
                                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                      aria-hidden
                                    />
                                    <span className="truncate">{sectorName}</span>
                                  </dd>
                                </div>
                              ) : null}
                              <div className="min-w-0">
                                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t("modal.user")}
                                </dt>
                                <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                                  <UserIcon
                                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                    aria-hidden
                                  />
                                  <span className="truncate">
                                    {solicitacao.user.name}
                                  </span>
                                </dd>
                              </div>
                              <div
                                className={cn(
                                  "min-w-0",
                                  sectorName
                                    ? "sm:col-span-2 lg:col-span-1"
                                    : "sm:col-span-1"
                                )}
                              >
                                <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t("modal.start")} / {t("modal.end")}
                                </dt>
                                <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
                                  <Calendar
                                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                                    aria-hidden
                                  />
                                  <span className="truncate">{scheduleLabel}</span>
                                </dd>
                              </div>
                            </dl>

                            {solicitacao.purpose ? (
                              <div className="mt-3 border-t border-border/70 pt-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t("modal.purpose")}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                                  {solicitacao.purpose}
                                </p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                <Pagination
                  page={safeSolPage}
                  pageSize={listPageSize}
                  total={totalFilteredSol}
                  onPageChange={setListPage}
                  onPageSizeChange={size => {
                    setListPageSize(size);
                    setListPage(1);
                  }}
                />
              </div>
            )}

            <Drawer
              isOpen={isDetailsModalOpen}
              onClose={() => setIsDetailsModalOpen(false)}
              title={t("modal.details")}
              closeOnEscape={!isRejectDrawerOpen}
            >
              {selectedSolicitacao && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        {t("modal.room")}
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-900 dark:text-white">
                          {selectedSolicitacao.room?.name ||
                            rooms.find(r => r.id === selectedSolicitacao.roomId)
                              ?.name ||
                            t("unknownRoom")}
                        </span>
                      </div>
                      {selectedSolicitacao.room?.sector?.name ? (
                        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                          {t("card.sector")}:{" "}
                          {selectedSolicitacao.room.sector.name}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        {t("modal.user")}
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <UserIcon className="w-4 h-4 text-green-400" />
                        <span className="text-slate-900 dark:text-white">
                          {selectedSolicitacao.user.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        {t("modal.start")}
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-900 dark:text-white">
                          {formatDateTime(
                            new Date(selectedSolicitacao.startTime)
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        {t("modal.end")}
                      </label>
                      <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Clock className="w-4 h-4 text-red-400" />
                        <span className="text-slate-900 dark:text-white">
                          {formatDateTime(
                            new Date(selectedSolicitacao.endTime)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSolicitacao.purpose && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        {t("modal.purpose")}
                      </label>
                      <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                        {selectedSolicitacao.purpose}
                      </p>
                    </div>
                  )}

                  {(selectedSolicitacao.status === "APPROVED" ||
                    selectedSolicitacao.status === "REJECTED") &&
                  (selectedSolicitacao.decidedBy ||
                    selectedSolicitacao.decidedAt ||
                    selectedSolicitacao.decisionReason) ? (
                    <div className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        {t("modal.decisionTitle")}
                      </p>
                      {selectedSolicitacao.decidedBy ? (
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {t("modal.decidedBy")}:{" "}
                          {selectedSolicitacao.decidedBy.name ||
                            selectedSolicitacao.decidedBy.email}
                        </p>
                      ) : null}
                      {selectedSolicitacao.decidedAt ? (
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {t("modal.decidedAt")}:{" "}
                          {formatDateTime(
                            new Date(selectedSolicitacao.decidedAt)
                          )}
                        </p>
                      ) : null}
                      {selectedSolicitacao.decisionReason ? (
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {t("modal.decisionReason")}:{" "}
                          {selectedSolicitacao.decisionReason}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                      {t("modal.status")}
                    </label>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                        getReservationStatusStyle(selectedSolicitacao.status)
                      )}
                    >
                      {getStatusText(selectedSolicitacao.status)}
                    </span>
                  </div>

                  {selectedSolicitacao.status === "PENDING" &&
                    !isOwnRequest(selectedSolicitacao) && (
                      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button
                          variant="outline"
                          onClick={() => setIsDetailsModalOpen(false)}
                          className="flex-1"
                        >
                          {t("modal.close")}
                        </Button>
                        <Button
                          onClick={() => handleApprove(selectedSolicitacao)}
                          disabled={actionLoading === selectedSolicitacao.id}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {actionLoading === selectedSolicitacao.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {t("card.approve")}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => openRejectDrawer(selectedSolicitacao)}
                          disabled={actionLoading === selectedSolicitacao.id}
                          variant="outline"
                          className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          {actionLoading === selectedSolicitacao.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              {t("card.reject")}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  {selectedSolicitacao.status === "PENDING" &&
                    isOwnRequest(selectedSolicitacao) && (
                      <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
                        {t("card.selfApproveBlocked")}
                      </p>
                    )}
                </div>
              )}
            </Drawer>

            <Drawer
              isOpen={isConflictModalOpen}
              onClose={() => setIsConflictModalOpen(false)}
              title={t("conflict.title")}
              size="lg"
            >
              {conflictData && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <div>
                      <h3 className="font-semibold text-red-400">
                        {t("conflict.title")}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {t("conflict.message")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-3">
                      {t("conflict.listTitle")}
                    </h4>
                    <div className="space-y-3">
                      {conflictData.conflicts.map(
                        (conflict: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-white">
                                  {conflict.user?.name || t("unknownUser")}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {formatDateTime(new Date(conflict.startTime))}{" "}
                                  - {formatDateTime(new Date(conflict.endTime))}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                                {t("conflict.badge")}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <Button
                      variant="outline"
                      onClick={() => setIsConflictModalOpen(false)}
                      className="flex-1"
                    >
                      {t("conflict.cancel")}
                    </Button>
                    <Button
                      onClick={handleForceApprove}
                      disabled={actionLoading === conflictData.solicitacao.id}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {actionLoading === conflictData.solicitacao.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          {t("conflict.forceApprove")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Drawer>

            <Drawer
              isOpen={isRejectDrawerOpen}
              onClose={closeRejectDrawer}
              title={t("rejectModal.title")}
            >
              {rejectTarget && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {rejectTarget.isRecurring
                      ? t("rejectModal.descriptionRecurring")
                      : t("rejectModal.description")}
                  </p>
                  <div>
                    <label
                      htmlFor="reject-reason"
                      className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block"
                    >
                      {t("rejectModal.reasonLabel")}
                    </label>
                    <textarea
                      id="reject-reason"
                      rows={4}
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder={t("rejectModal.placeholder")}
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={closeRejectDrawer}
                      disabled={actionLoading === rejectTarget.id}
                    >
                      {t("rejectModal.cancel")}
                    </Button>
                    <Button
                      type="button"
                      onClick={confirmReject}
                      disabled={actionLoading === rejectTarget.id}
                      className="flex flex-1 items-center justify-center gap-0 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {actionLoading === rejectTarget.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          {t("rejectModal.confirm")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Drawer>
          </>
        )}
      </PageLayout>
    </SolicitacoesGuard>
  );
};

export default SolicitacoesPage;
