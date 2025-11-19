export interface Incident {
  id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "REPORTED" | "IN_ANALYSIS" | "IN_PROGRESS" | "RESOLVED";
  category: string;
  reportedById: string;
  assignedToId: string | null;
  roomId: string | null;
  itemId: string | null;
  estimatedResolutionTime: Date | null;
  actualResolutionTime: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relacionamentos
  reportedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  room?: {
    id: string;
    name: string;
    description: string;
    status: string;
  } | null;
  item?: {
    id: string;
    name: string;
    description: string;
  } | null;
  statusHistory?: IncidentStatusHistory[];
}

export interface IncidentStatusHistory {
  id: string;
  incidentId: string;
  fromStatus: "REPORTED" | "IN_ANALYSIS" | "IN_PROGRESS" | "RESOLVED";
  toStatus: "REPORTED" | "IN_ANALYSIS" | "IN_PROGRESS" | "RESOLVED";
  notes: string | null;
  changedById: string;
  createdAt: Date;

  changedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  roomId?: string;
  itemId?: string;
  estimatedResolutionTime?: string; // ISO string
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: "REPORTED" | "IN_ANALYSIS" | "IN_PROGRESS" | "RESOLVED";
  assignedToId?: string | null;
  estimatedResolutionTime?: string | null; // ISO string
  resolutionNotes?: string;
}

export interface IncidentsResponse {
  incidents: Incident[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IncidentFilters {
  status?: "REPORTED" | "IN_ANALYSIS" | "IN_PROGRESS" | "RESOLVED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category?: string;
  assignedToId?: string;
  reportedById?: string;
  roomId?: string;
  itemId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AssignableUser {
  id: string;
  name: string;
  email: string;
  role: string;
  activeIncidents: number;
}

export interface IncidentStats {
  overview: {
    total: number;
    reported: number;
    inAnalysis: number;
    inProgress: number;
    resolved: number;
    activeTotal: number;
  };
  priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  personal?: {
    reported: number;
    assigned: number;
    assignedResolved: number;
  } | null;
  categories: Array<{
    category: string;
    count: number;
  }>;
  performance: {
    averageResolutionTimeHours: number;
    resolvedLast30Days: number;
  };
  mostAffected: {
    rooms: Array<{
      id: string | null;
      name: string;
      incidents: number;
    }>;
    items: Array<{
      id: string | null;
      name: string;
      incidents: number;
    }>;
  };
}

// Constantes para categorias de incidentes
export const INCIDENT_CATEGORIES = [
  "EQUIPMENT_FAILURE",
  "INFRASTRUCTURE",
  "SOFTWARE",
  "SAFETY",
  "MAINTENANCE", 
  "ELECTRICAL",
  "NETWORK",
  "OTHER",
] as const;

export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

// Constantes para status de incidentes
export const INCIDENT_STATUS_LABELS = {
  REPORTED: "Reportado",
  IN_ANALYSIS: "Em Análise",
  IN_PROGRESS: "Em Andamento",
  RESOLVED: "Resolvido",
} as const;

export const INCIDENT_PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
} as const;

export const INCIDENT_CATEGORY_LABELS = {
  EQUIPMENT_FAILURE: "Falha de Equipamento",
  INFRASTRUCTURE: "Infraestrutura", 
  SOFTWARE: "Software",
  SAFETY: "Segurança",
  MAINTENANCE: "Manutenção",
  ELECTRICAL: "Elétrico",
  NETWORK: "Rede",
  OTHER: "Outros",
} as const;

// Cores para status e prioridades
export const INCIDENT_STATUS_COLORS = {
  REPORTED: "orange",
  IN_ANALYSIS: "blue",
  IN_PROGRESS: "purple",
  RESOLVED: "green",
} as const;

export const INCIDENT_PRIORITY_COLORS = {
  LOW: "gray",
  MEDIUM: "yellow",
  HIGH: "orange",
  CRITICAL: "red",
} as const;
