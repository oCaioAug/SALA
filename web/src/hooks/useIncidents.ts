"use client";

import { useState, useCallback } from "react";
import {
  Incident,
  IncidentsResponse,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentFilters,
  AssignableUser,
  IncidentStats,
} from "@/types/incidents";

export function useIncidents() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Buscar incidentes com filtros
  const getIncidents = useCallback(
    async (
      filters: IncidentFilters = {}
    ): Promise<IncidentsResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (filters.status) params.append("status", filters.status);
        if (filters.priority) params.append("priority", filters.priority);
        if (filters.category) params.append("category", filters.category);
        if (filters.assignedToId)
          params.append("assignedToId", filters.assignedToId);
        if (filters.reportedById)
          params.append("reportedById", filters.reportedById);
        if (filters.roomId) params.append("roomId", filters.roomId);
        if (filters.itemId) params.append("itemId", filters.itemId);
        if (filters.search) params.append("search", filters.search);
        if (filters.sortBy) params.append("sortBy", filters.sortBy);
        if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.limit) params.append("limit", filters.limit.toString());

        const response = await fetch(`/api/incidents?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Erro ao buscar incidentes");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        console.error("❌ Erro ao buscar incidentes:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Buscar incidente específico
  const getIncident = useCallback(
    async (id: string): Promise<Incident | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/incidents/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Incidente não encontrado");
          }
          throw new Error("Erro ao buscar incidente");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        console.error("❌ Erro ao buscar incidente:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Criar novo incidente
  const createIncident = useCallback(
    async (data: CreateIncidentRequest): Promise<Incident | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/incidents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao criar incidente");
        }

        const incident = await response.json();
        return incident;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        console.error("❌ Erro ao criar incidente:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Atualizar incidente
  const updateIncident = useCallback(
    async (
      id: string,
      data: UpdateIncidentRequest
    ): Promise<Incident | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/incidents/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao atualizar incidente");
        }

        const incident = await response.json();
        return incident;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        console.error("❌ Erro ao atualizar incidente:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Deletar incidente (apenas admins)
  const deleteIncident = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar incidente");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("❌ Erro ao deletar incidente:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar usuários disponíveis para atribuição
  const getAssignableUsers = useCallback(async (): Promise<
    AssignableUser[] | null
  > => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/incidents/assignable-users");

      if (!response.ok) {
        throw new Error("Erro ao buscar usuários");
      }

      const users = await response.json();
      return users;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("❌ Erro ao buscar usuários:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas de incidentes
  const getIncidentStats =
    useCallback(async (): Promise<IncidentStats | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/incidents/stats");

        if (!response.ok) {
          throw new Error("Erro ao buscar estatísticas");
        }

        const stats = await response.json();
        return stats;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        console.error("❌ Erro ao buscar estatísticas:", err);
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

  return {
    loading,
    error,
    clearError,
    getIncidents,
    getIncident,
    createIncident,
    updateIncident,
    deleteIncident,
    getAssignableUsers,
    getIncidentStats,
  };
}
