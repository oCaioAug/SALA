"use client";

import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  Search,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import React, { useEffect, useState } from "react";

import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { ReservationWithDetails, Room, User } from "@/lib/types";

const SolicitacoesPage: React.FC = () => {
  const t = useTranslations("Solicitacoes");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState("solicitacoes");
  const [solicitacoes, setSolicitacoes] = useState<ReservationWithDetails[]>(
    []
  );
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSolicitacao, setSelectedSolicitacao] =
    useState<ReservationWithDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [focusedReservationId, setFocusedReservationId] = useState<
    string | null
  >(null);

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

        const [solicitacoesResponse, roomsResponse, usersResponse] =
          await Promise.all([
            fetch("/api/reservations?status=PENDING"),
            fetch("/api/rooms"),
            fetch("/api/users").catch(() => null),
          ]);

        if (!solicitacoesResponse.ok) {
          const errorData = await solicitacoesResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Erro ${solicitacoesResponse.status}: ${solicitacoesResponse.statusText}`
          );
        }

        if (!roomsResponse.ok) {
          throw new Error("Erro ao carregar salas");
        }

        const [solicitacoesData, roomsData, usersData] = await Promise.all([
          solicitacoesResponse.json(),
          roomsResponse.json(),
          usersResponse?.ok ? usersResponse.json() : Promise.resolve([]),
        ]);

        setSolicitacoes(solicitacoesData);
        setRooms(roomsData);
        setUsers(usersData || []);
      } catch (err) {
        console.error("Erro ao carregar solicitações:", err);
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
        throw new Error("Erro ao verificar conflitos");
      }

      const conflictData = await response.json();
      return conflictData;
    } catch (error) {
      console.error("Erro ao verificar conflitos:", error);
      return null;
    }
  };

  const handleApprove = async (solicitacao: ReservationWithDetails) => {
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

  const handleReject = async (solicitacao: ReservationWithDetails) => {
    try {
      setActionLoading(solicitacao.id);
      await rejectSolicitacao(solicitacao.id);
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      showError(t("feedback.errorReject"));
    } finally {
      setActionLoading(null);
    }
  };

  const approveSolicitacao = async (solicitacaoId: string) => {
    const response = await fetch(`/api/reservations/${solicitacaoId}/approve`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Erro ao aprovar solicitação");
    }

    // Atualizar lista
    setSolicitacoes(prev => prev.filter(s => s.id !== solicitacaoId));
    showSuccess(t("feedback.successApprove"));
    setIsDetailsModalOpen(false);
  };

  const rejectSolicitacao = async (solicitacaoId: string) => {
    const response = await fetch(`/api/reservations/${solicitacaoId}/reject`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Erro ao rejeitar solicitação");
    }

    // Atualizar lista
    setSolicitacoes(prev => prev.filter(s => s.id !== solicitacaoId));
    showSuccess(t("feedback.successReject"));
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
    // Converter locale do next-intl para formato do Intl
    const intlLocale =
      locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : locale;

    return date.toLocaleString(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "text-yellow-400 bg-yellow-500/10";
      case "APPROVED":
        return "text-green-400 bg-green-500/10";
      case "REJECTED":
        return "text-red-400 bg-red-500/10";
      default:
        return "text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-500/10";
    }
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

  if (loading) {
    return <LoadingPage message={t("loading")} />;
  }

  if (error) {
    return (
      <ErrorPage
        error={error}
        onRetry={() => window.location.reload()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
      onNotificationItemClick={globalNotificationHandler}
      notificationUpdateTrigger={0}
    >
      {/* Header da página */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
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
        <div className="space-y-4">
          {filteredSolicitacoes.map(solicitacao => (
            <Card
              key={solicitacao.id}
              variant="elevated"
              hover
              className={`group ${
                focusedReservationId === solicitacao.id
                  ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50"
                  : ""
              }`}
              id={`solicitacao-${solicitacao.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                      <Calendar className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {rooms.find(r => r.id === solicitacao.roomId)?.name ||
                          "Sala desconhecida"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          {solicitacao.user.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDateTime(
                            new Date(solicitacao.startTime)
                          )} - {formatDateTime(new Date(solicitacao.endTime))}
                        </div>
                      </div>
                      {solicitacao.purpose && (
                        <p className="text-sm text-slate-700 dark:text-gray-300 mt-2">
                          {solicitacao.purpose}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        solicitacao.status
                      )}`}
                    >
                      {getStatusText(solicitacao.status)}
                    </span>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSolicitacaoClick(solicitacao)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {solicitacao.status === "PENDING" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(solicitacao)}
                            disabled={actionLoading === solicitacao.id}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          >
                            {actionLoading === solicitacao.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(solicitacao)}
                            disabled={actionLoading === solicitacao.id}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            {actionLoading === solicitacao.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalhes da solicitação */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={t("modal.details")}
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
                    {rooms.find(r => r.id === selectedSolicitacao.roomId)
                      ?.name || "Sala desconhecida"}
                  </span>
                </div>
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
                    {formatDateTime(new Date(selectedSolicitacao.startTime))}
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
                    {formatDateTime(new Date(selectedSolicitacao.endTime))}
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

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                {t("modal.status")}
              </label>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  selectedSolicitacao.status
                )}`}
              >
                {getStatusText(selectedSolicitacao.status)}
              </span>
            </div>

            {selectedSolicitacao.status === "PENDING" && (
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
                  onClick={() => handleReject(selectedSolicitacao)}
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
          </div>
        )}
      </Modal>

      {/* Modal de conflito */}
      <Modal
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
                <p className="text-sm text-gray-300">{t("conflict.message")}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-white mb-3">
                Reservas Conflitantes:
              </h4>
              <div className="space-y-3">
                {conflictData.conflicts.map((conflict: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {conflict.user?.name || "Usuário desconhecido"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDateTime(new Date(conflict.startTime))} -{" "}
                          {formatDateTime(new Date(conflict.endTime))}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Conflito
                      </span>
                    </div>
                  </div>
                ))}
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
      </Modal>
    </PageLayout>
  );
};

export default SolicitacoesPage;
