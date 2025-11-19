"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { useNavigation } from "@/lib/hooks/useNavigation";
import {
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useIncidents } from "@/hooks/useIncidents";
import {
  Incident,
  IncidentFilters,
  IncidentStats,
  INCIDENT_STATUS_LABELS,
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_CATEGORIES,
} from "@/types/incidents";

export default function IncidentsPage() {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState("incidentes");
  const {
    loading,
    error,
    clearError,
    getIncidents,
    getIncidentStats,
    deleteIncident,
    createIncident,
  } = useIncidents();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [filters, setFilters] = useState<IncidentFilters>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [editFormStatus, setEditFormStatus] = useState<string>("");
  const itemSelectRef = useRef<HTMLSelectElement>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  // Hook de navegação
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Verificar autenticação
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      return;
    }
  }, [session, status]);

  // Carregar dados iniciais
  useEffect(() => {
    if (session) {
      loadIncidents();
      loadStats();
      loadRoomsAndItems();
    }
  }, [session]);

  const loadRoomsAndItems = async () => {
    try {
      const [roomsResponse, itemsResponse] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/items"),
      ]);

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData);
      }

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      }
    } catch (error) {
      console.error("Erro ao carregar salas e itens:", error);
    }
  };

  // Recarregar incidentes quando filtros mudarem
  useEffect(() => {
    if (!session) return;

    const timer = setTimeout(() => {
      loadIncidents();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, searchTerm, session]);

  const loadIncidents = async () => {
    const searchFilters = {
      ...filters,
      search: searchTerm || undefined,
    };

    const response = await getIncidents(searchFilters);
    if (response) {
      setIncidents(response.incidents);
      setPagination(response.pagination);
    }
  };

  const loadStats = async () => {
    const response = await getIncidentStats();
    if (response) {
      setStats(response);
    }
  };

  const handleFilterChange = (key: keyof IncidentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este incidente?")) {
      return;
    }

    const success = await deleteIncident(id);
    if (success) {
      loadIncidents();
      loadStats();
    }
  };

  // Verificar se o incidente pode ser editado
  const canEditIncident = (incident: Incident): boolean => {
    // Admin pode editar qualquer incidente, incluindo resolvidos
    if (isAdmin) {
      return true;
    }

    // Para usuários não admin, não pode editar se já está resolvido/concluído
    if (incident.status === "RESOLVED") {
      return false;
    }

    // Usuário pode editar se for o responsável ou quem reportou
    return (
      incident.assignedTo?.id === session?.user?.id ||
      incident.reportedBy.id === session?.user?.id
    );
  };

  // Abrir modal de edição
  const handleEditIncident = (incident: Incident) => {
    if (!canEditIncident(incident)) {
      return;
    }
    setSelectedIncident(incident);
    setEditFormStatus(incident.status); // Inicializar com o status atual
    setIsDetailsModalOpen(false); // Fechar modal de detalhes
    setIsEditModalOpen(true);
  };

  // Atualizar incidente
  const handleUpdateIncident = async (updatedData: Partial<Incident>) => {
    if (!selectedIncident) return;

    try {
      setEditLoading(true);

      const response = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar incidente");
      }

      // Recarregar dados
      await loadIncidents();
      await loadStats();

      // Fechar modal
      setIsEditModalOpen(false);
      setSelectedIncident(null);

      // Mostrar sucesso (assumindo que existe uma função de toast/notification)
      console.log("Incidente atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar incidente:", error);
      // Mostrar erro (assumindo que existe uma função de toast/notification)
    } finally {
      setEditLoading(false);
    }
  };

  // Criar novo incidente
  const handleCreateIncident = async (incidentData: any) => {
    try {
      setCreateLoading(true);

      const success = await createIncident(incidentData);

      if (success) {
        // Recarregar dados
        await loadIncidents();
        await loadStats();

        // Fechar modal e resetar estado
        setIsCreateModalOpen(false);
        setSelectedRoomId("");

        console.log("Incidente criado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao criar incidente:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtrar itens por sala selecionada
  const getFilteredItems = () => {
    if (!selectedRoomId) {
      return items;
    }
    return items.filter(item => item.roomId === selectedRoomId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "REPORTED":
        return <AlertTriangle className="h-4 w-4" />;
      case "IN_ANALYSIS":
        return <Search className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m atrás`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  // Loading state
  if (status === "loading") {
    return <LoadingPage message="Carregando incidentes..." />;
  }

  // Auth error state
  if (status === "unauthenticated") {
    return (
      <ErrorPage error="Você precisa estar logado para acessar esta página." />
    );
  }

  return (
    <PageLayout currentPage={currentPage} onNavigate={navigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Incidentes</h1>
            <p className="text-muted-foreground">
              Gerencie problemas e manutenções em laboratórios e equipamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                loadIncidents();
                loadStats();
              }}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Reportar Incidente
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ativo</p>
                  <p className="text-2xl font-bold">
                    {stats.overview.activeTotal}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Críticos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.priority.critical}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold">
                    {stats.overview.inProgress}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {stats.performance.averageResolutionTimeHours}h
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Buscar incidentes por título, descrição ou categoria..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filters.status || ""}
                onChange={e =>
                  handleFilterChange("status", e.target.value || undefined)
                }
                className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os Status</option>
                <option value="REPORTED">Reportado</option>
                <option value="IN_ANALYSIS">Em Análise</option>
                <option value="IN_PROGRESS">Em Andamento</option>
                <option value="RESOLVED">Resolvido</option>
              </select>

              <select
                value={filters.priority || ""}
                onChange={e =>
                  handleFilterChange("priority", e.target.value || undefined)
                }
                className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Prioridades</option>
                <option value="CRITICAL">Crítica</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>

              <select
                value={filters.category || ""}
                onChange={e =>
                  handleFilterChange("category", e.target.value || undefined)
                }
                className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Categorias</option>
                {INCIDENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {INCIDENT_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Alertas */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-1" />
              <div className="flex-1">
                <p className="text-red-800">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={clearError}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de Incidentes */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <Card className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum incidente encontrado
              </p>
            </Card>
          ) : (
            incidents.map(incident => (
              <Card key={incident.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Título e Status */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{incident.title}</h3>
                      <span
                        className={`
                        px-2 py-1 text-xs rounded-full font-medium flex flex-row items-center
                        ${
                          incident.status === "RESOLVED"
                            ? "bg-green-100 text-green-800"
                            : incident.status === "IN_PROGRESS"
                              ? "bg-purple-100 text-purple-800"
                              : incident.status === "IN_ANALYSIS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                        }
                      `}
                      >
                        {getStatusIcon(incident.status)}
                        <span className="ml-1">
                          {
                            INCIDENT_STATUS_LABELS[
                              incident.status as keyof typeof INCIDENT_STATUS_LABELS
                            ]
                          }
                        </span>
                      </span>
                      <span
                        className={`
                        px-2 py-1 text-xs rounded-full font-medium
                        ${
                          incident.priority === "CRITICAL"
                            ? "bg-red-100 text-red-800"
                            : incident.priority === "HIGH"
                              ? "bg-orange-100 text-orange-800"
                              : incident.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }
                      `}
                      >
                        {
                          INCIDENT_PRIORITY_LABELS[
                            incident.priority as keyof typeof INCIDENT_PRIORITY_LABELS
                          ]
                        }
                      </span>
                    </div>

                    {/* Descrição */}
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {incident.description}
                    </p>

                    {/* Metadados */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        <strong>Categoria:</strong>{" "}
                        {
                          INCIDENT_CATEGORY_LABELS[
                            incident.category as keyof typeof INCIDENT_CATEGORY_LABELS
                          ]
                        }
                      </span>
                      {incident.room && (
                        <span>
                          <strong>Sala:</strong> {incident.room.name}
                        </span>
                      )}
                      {incident.item && (
                        <span>
                          <strong>Item:</strong> {incident.item.name}
                        </span>
                      )}
                      <span>
                        <strong>Reportado por:</strong>{" "}
                        {incident.reportedBy.name}
                      </span>
                      {incident.assignedTo && (
                        <span>
                          <strong>Atribuído para:</strong>{" "}
                          {incident.assignedTo.name}
                        </span>
                      )}
                      <span>
                        {formatRelativeTime(new Date(incident.createdAt))}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIncident(incident);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEditIncident(incident) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditIncident(incident)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIncident(incident.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} até{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} incidentes
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de Detalhes do Incidente */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title="Detalhes do Incidente"
          size="xl"
        >
          {selectedIncident && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Título
                  </label>
                  <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                    {selectedIncident.title}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Status
                  </label>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <span
                      className={`
                        px-3 py-1 text-sm rounded-full font-medium
                        ${
                          selectedIncident.status === "RESOLVED"
                            ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                            : selectedIncident.status === "IN_PROGRESS"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400"
                              : selectedIncident.status === "IN_ANALYSIS"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400"
                        }
                      `}
                    >
                      {
                        INCIDENT_STATUS_LABELS[
                          selectedIncident.status as keyof typeof INCIDENT_STATUS_LABELS
                        ]
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Prioridade
                  </label>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <span
                      className={`
                        px-3 py-1 text-sm rounded-full font-medium
                        ${
                          selectedIncident.priority === "CRITICAL"
                            ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                            : selectedIncident.priority === "HIGH"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400"
                              : selectedIncident.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
                        }
                      `}
                    >
                      {
                        INCIDENT_PRIORITY_LABELS[
                          selectedIncident.priority as keyof typeof INCIDENT_PRIORITY_LABELS
                        ]
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Categoria
                  </label>
                  <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white">
                    {
                      INCIDENT_CATEGORY_LABELS[
                        selectedIncident.category as keyof typeof INCIDENT_CATEGORY_LABELS
                      ]
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Descrição
                </label>
                <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white whitespace-pre-wrap">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Reportado por
                  </label>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <p className="text-slate-900 dark:text-white font-medium">
                      {selectedIncident.reportedBy.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {selectedIncident.reportedBy.email}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Atribuído para
                  </label>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {selectedIncident.assignedTo ? (
                      <>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {selectedIncident.assignedTo.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {selectedIncident.assignedTo.email}
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-600 dark:text-gray-400">
                        Não atribuído
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {(selectedIncident.room || selectedIncident.item) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedIncident.room && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        Sala
                      </label>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-900 dark:text-white font-medium">
                          {selectedIncident.room.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {selectedIncident.room.description}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedIncident.item && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                        Item
                      </label>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-900 dark:text-white font-medium">
                          {selectedIncident.item.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {selectedIncident.item.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedIncident.resolutionNotes && (
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Notas de Resolução
                  </label>
                  <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-white whitespace-pre-wrap">
                    {selectedIncident.resolutionNotes}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                {canEditIncident(selectedIncident) && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditIncident(selectedIncident)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Edição do Incidente */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Incidente"
          size="xl"
        >
          {selectedIncident && (
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const status = formData.get("status") as string;
                const resolutionNotes = formData.get("resolutionNotes") as string;
                
                // Validar se notas de resolução são obrigatórias quando status é RESOLVED
                if (status === "RESOLVED" && (!resolutionNotes || resolutionNotes.trim() === "")) {
                  alert("As notas de resolução são obrigatórias quando o incidente é marcado como resolvido.");
                  return;
                }

                const updatedData: Partial<Incident> = {
                  title: formData.get("title") as string,
                  description: formData.get("description") as string,
                  status: status as Incident["status"],
                  priority: formData.get("priority") as Incident["priority"],
                  resolutionNotes: resolutionNotes || undefined,
                };
                handleUpdateIncident(updatedData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedIncident.title}
                    required
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormStatus}
                    onChange={(e) => setEditFormStatus(e.target.value)}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="REPORTED">Reportado</option>
                    <option value="IN_ANALYSIS">Em Análise</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="RESOLVED">Resolvido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    defaultValue={selectedIncident.priority}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Descrição
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedIncident.description}
                  required
                  rows={4}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Notas de Resolução {editFormStatus === "RESOLVED" && <span className="text-red-500">*</span>}
                  {editFormStatus === "RESOLVED" && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                      (Obrigatório para incidentes resolvidos)
                    </span>
                  )}
                </label>
                <textarea
                  name="resolutionNotes"
                  defaultValue={selectedIncident.resolutionNotes || ""}
                  rows={3}
                  placeholder={editFormStatus === "RESOLVED" 
                    ? "Descreva como o problema foi resolvido..." 
                    : "Adicione notas sobre a resolução do incidente..."}
                  className={`w-full p-3 bg-slate-100 dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    editFormStatus === "RESOLVED"
                      ? "border-blue-300 dark:border-blue-600 focus:ring-blue-500"
                      : "border-slate-300 dark:border-gray-600 focus:ring-blue-500"
                  }`}
                />
              </div>

              {editFormStatus === "RESOLVED" && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <div className="text-green-600 dark:text-green-400 mt-0.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-sm text-green-800 dark:text-green-200">
                      <p className="font-medium">Finalizando incidente</p>
                      <p>Certifique-se de detalhar a solução aplicada nas notas de resolução para referência futura.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1"
                  disabled={editLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={editLoading}>
                  {editLoading ? "Salvando..." : editFormStatus === "RESOLVED" ? "Resolver Incidente" : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal de Criação de Incidente */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedRoomId("");
          }}
          title="Reportar Novo Incidente"
          size="xl"
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              
              // Verificar se o usuário está logado
              if (!session?.user?.id) {
                alert("Você precisa estar logado para reportar um incidente.");
                return;
              }

              const formData = new FormData(e.currentTarget);
              const roomIdValue = formData.get("roomId") as string;
              const itemIdValue = formData.get("itemId") as string;
              
              // Converter strings vazias em undefined
              const roomId = roomIdValue && roomIdValue.trim() ? roomIdValue : undefined;
              const itemId = itemIdValue && itemIdValue.trim() ? itemIdValue : undefined;
              
              // Lógica para evitar enviar tanto roomId quanto itemId
              // Se item está selecionado, usar apenas o item (mais específico)
              // Se apenas sala está selecionada, usar a sala
              const finalRoomId = itemId ? undefined : roomId;
              const finalItemId = itemId || undefined;

              // Validar que pelo menos uma sala ou item foi selecionado
              if (!finalRoomId && !finalItemId) {
                alert("Por favor, selecione uma sala ou um item para associar ao incidente.");
                return;
              }

              const newIncidentData = {
                title: formData.get("title") as string,
                description: formData.get("description") as string,
                priority: formData.get("priority") as
                  | "LOW"
                  | "MEDIUM"
                  | "HIGH"
                  | "CRITICAL",
                category: formData.get("category") as string,
                roomId: finalRoomId,
                itemId: finalItemId,
                reportedById: session.user.id,
              };

              // Debug log
              console.log("🐛 Debug - Criação de incidente:", {
                formData: {
                  title: formData.get("title"),
                  description: formData.get("description"),
                  priority: formData.get("priority"),
                  category: formData.get("category"),
                  roomIdRaw: roomIdValue,
                  itemIdRaw: itemIdValue,
                },
                processed: {
                  roomId: roomId,
                  itemId: itemId,
                  finalRoomId: finalRoomId,
                  finalItemId: finalItemId,
                },
                payload: newIncidentData,
                session: {
                  userId: session.user.id,
                  email: session.user.email
                }
              });

              handleCreateIncident(newIncidentData);
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Título *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Descreva brevemente o problema..."
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Prioridade *
                </label>
                <select
                  name="priority"
                  required
                  defaultValue="MEDIUM"
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                Categoria *
              </label>
              <select
                name="category"
                required
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma categoria</option>
                {INCIDENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {INCIDENT_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                Descrição *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Descreva detalhadamente o problema, incluindo quando começou, sintomas e tentativas de resolução..."
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Sala <span className="text-sm text-slate-500 dark:text-gray-400">(escolha uma sala OU um item)</span>
                </label>
                <select
                  name="roomId"
                  value={selectedRoomId}
                  onChange={e => {
                    setSelectedRoomId(e.target.value);
                    // Resetar seleção de item quando a sala mudar
                    if (itemSelectRef.current) {
                      itemSelectRef.current.value = "";
                    }
                  }}
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma sala...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {room.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                  Item/Equipamento
                  {selectedRoomId && getFilteredItems().length === 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                      - Nenhum item cadastrado nesta sala
                    </span>
                  )}
                </label>
                <select
                  ref={itemSelectRef}
                  name="itemId"
                  className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {selectedRoomId && getFilteredItems().length === 0
                      ? "Nenhum item disponível nesta sala"
                      : "Nenhum item específico"}
                  </option>
                  {getFilteredItems().map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}{" "}
                      {!selectedRoomId && item.room && `(${item.room.name})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-amber-600 dark:text-amber-400 mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">⚠️ Localização obrigatória:</p>
                  <p>Você deve selecionar pelo menos uma <strong>sala</strong> ou um <strong>item específico</strong>. Se selecionar um item, a sala será automaticamente determinada.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Dica:</p>
                  <p>
                    Seja específico na descrição para agilizar a resolução.
                    Inclua horários, mensagens de erro e passos para reproduzir
                    o problema.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
                disabled={createLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={createLoading}>
                {createLoading ? "Criando..." : "Reportar Incidente"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageLayout>
  );
}
