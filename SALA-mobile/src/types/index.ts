// Tipos para o aplicativo móvel SALA

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatar?: string; // Para compatibilidade interna do app
  image?: string; // Para compatibilidade com a API
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  status: "LIVRE" | "EM_USO" | "RESERVADO";
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
  items?: Item[];
  reservations?: Reservation[];
}

export interface ItemImage {
  id: string;
  filename: string;
  path: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  specifications: string[];
  quantity: number;
  icon: string | null;
  roomId: string | null;
  createdAt: string;
  updatedAt: string;
  images?: ItemImage[];
}

export interface Reservation {
  id: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: ReservationStatusEnum;
  createdAt: string;
  updatedAt: string;
  user?: User;
  room?: Room;
}

export enum ReservationStatusEnum {
  ACTIVE = "ACTIVE",
  APPROVED = "APPROVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export type RecurringPattern = "DAILY" | "WEEKLY" | "MONTHLY";

export interface RoomWithItems extends Room {
  items: Item[];
}

export interface ReservationWithDetails extends Reservation {
  user: User;
  room: Room;
}

// Tipos para navegação
export type RootStackParamList = {
  Home: undefined;
  RoomList: undefined;
  RoomDetails: { roomId: string };
  CreateReservation: { roomId: string };
  MyReservations: undefined;
  Profile: undefined;
  ProfileMain: undefined;
  EditProfile: { user: User };
  NotificationSettings: undefined;
  NotificationDebug: undefined;
  ReportIncident: { roomId?: string; itemId?: string };
  MyIncidents: undefined;
};

export type BottomTabParamList = {
  Rooms: undefined;
  Reservations: undefined;
  Profile: undefined;
};

// Tipos para componentes
export interface RoomCardProps {
  room: Room;
  onPress: () => void;
}

export interface ReservationCardProps {
  reservation: ReservationWithDetails;
  onCancel?: (reservationId: string) => void;
}

export interface StatusBadgeProps {
  status: Room["status"];
  size?: "small" | "medium" | "large";
}

// Configuração de status
export const ROOM_STATUS_CONFIG = {
  LIVRE: {
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    text: "Livre",
  },
  EM_USO: {
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    text: "Em Uso",
  },
  RESERVADO: {
    color: "#F59E0B",
    backgroundColor: "#FEF3C7",
    text: "Reservado",
  },
} as const;

export const RESERVATION_STATUS_CONFIG = {
  ACTIVE: {
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    text: "Ativa",
  },
  APPROVED: {
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    text: "Aprovada",
  },
  PENDING: {
    color: "#F59E0B",
    backgroundColor: "#FEF3C7",
    text: "Pendente",
  },
  REJECTED: {
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    text: "Rejeitada",
  },
  CANCELLED: {
    color: "#EF4444",
    backgroundColor: "#FEE2E2",
    text: "Cancelada",
  },
  COMPLETED: {
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    text: "Concluída",
  },
} as const;

// Tipos de Incidentes
export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentStatus = "REPORTED" | "IN_ANALYSIS" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type IncidentCategory =
  | "EQUIPMENT_FAILURE"
  | "INFRASTRUCTURE"
  | "SOFTWARE"
  | "SAFETY"
  | "MAINTENANCE"
  | "ELECTRICAL"
  | "NETWORK"
  | "OTHER";

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
  estimatedResolutionTime: string | null;
  actualResolutionTime: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reportedBy?: {
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
    status: string;
  } | null;
  item?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  priority: IncidentPriority;
  category: IncidentCategory;
  roomId?: string;
  itemId?: string;
  estimatedResolutionTime?: string;
}

export const INCIDENT_PRIORITY_LABELS: Record<IncidentPriority, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  REPORTED: "Reportado",
  IN_ANALYSIS: "Em Análise",
  IN_PROGRESS: "Em Andamento",
  RESOLVED: "Resolvido",
  CANCELLED: "Cancelado",
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

export const INCIDENT_PRIORITY_COLORS: Record<IncidentPriority, { color: string; backgroundColor: string }> = {
  LOW: { color: "#6B7280", backgroundColor: "#F3F4F6" },
  MEDIUM: { color: "#F59E0B", backgroundColor: "#FEF3C7" },
  HIGH: { color: "#EF4444", backgroundColor: "#FEE2E2" },
  CRITICAL: { color: "#DC2626", backgroundColor: "#FEE2E2" },
};
