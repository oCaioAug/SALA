// Tipos para o aplicativo móvel SALA

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatar?: string;
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
}

export interface Reservation {
  id: string;
  userId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  user?: User;
  room?: Room;
}

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
