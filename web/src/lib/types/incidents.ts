// Tipos para o sistema de incidentes
import { User, Room, Item } from "@prisma/client";

export enum IncidentStatus {
  REPORTED = "REPORTED",
  IN_ANALYSIS = "IN_ANALYSIS",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CANCELLED = "CANCELLED",
}

export enum IncidentPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum IncidentCategory {
  EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  SOFTWARE = "SOFTWARE",
  SAFETY = "SAFETY",
  MAINTENANCE = "MAINTENANCE",
  ELECTRICAL = "ELECTRICAL",
  NETWORK = "NETWORK",
  OTHER = "OTHER",
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  category: IncidentCategory;
  reportedById: string;
  assignedToId: string | null;
  roomId: string | null;
  itemId: string | null;
  estimatedResolutionTime: Date | null;
  actualResolutionTime: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentStatusHistory {
  id: string;
  incidentId: string;
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus;
  notes: string | null;
  changedById: string;
  createdAt: Date;
}

export interface IncidentWithDetails extends Incident {
  reportedBy: Pick<User, "id" | "name" | "email" | "role">;
  assignedTo?: Pick<User, "id" | "name" | "email" | "role"> | null;
  room?: Pick<Room, "id" | "name" | "status"> | null;
  item?: Pick<Item, "id" | "name" | "description"> | null;
  statusHistory?: Array<
    IncidentStatusHistory & {
      changedBy: Pick<User, "id" | "name" | "email">;
    }
  >;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  priority?: IncidentPriority;
  category: IncidentCategory;
  reportedById: string;
  roomId?: string;
  itemId?: string;
  estimatedResolutionTime?: string;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  assignedToId?: string;
  estimatedResolutionTime?: string;
  resolutionNotes?: string;
}

export interface IncidentFilters {
  status?: IncidentStatus;
  priority?: IncidentPriority;
  category?: IncidentCategory;
  assignedToId?: string;
  roomId?: string;
  itemId?: string;
  page?: number;
  limit?: number;
}

export interface IncidentListResponse {
  incidents: IncidentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Labels para exibição na UI
export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  REPORTED: "Reportado",
  IN_ANALYSIS: "Em Análise",
  IN_PROGRESS: "Em Andamento",
  RESOLVED: "Resolvido",
  CANCELLED: "Cancelado",
};

export const INCIDENT_PRIORITY_LABELS: Record<IncidentPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const INCIDENT_CATEGORY_LABELS: Record<IncidentCategory, string> = {
  EQUIPMENT_FAILURE: "Falha de Equipamento",
  INFRASTRUCTURE: "Infraestrutura",
  SOFTWARE: "Software",
  SAFETY: "Segurança",
  MAINTENANCE: "Manutenção",
  ELECTRICAL: "Elétrico",
  NETWORK: "Rede",
  OTHER: "Outros",
};

// Cores para status
export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  REPORTED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  IN_ANALYSIS:
    "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  IN_PROGRESS:
    "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  RESOLVED:
    "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300",
};

// Cores para prioridade
export const INCIDENT_PRIORITY_COLORS: Record<IncidentPriority, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};
