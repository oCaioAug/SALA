// Tipos para o sistema SALA
import {
  Image,
  Item,
  Notification,
  NotificationType,
  Reservation,
  ReservationStatus,
  Role,
  Room,
  RoomStatus,
  User,
} from "@prisma/client";

export type {
  Image,
  Item,
  Notification,
  NotificationType,
  Reservation,
  ReservationStatus,
  Role,
  Room,
  RoomStatus,
  User,
};

// Tipos estendidos para o frontend
export interface ItemWithImages extends Item {
  images: Image[];
}

export interface RoomWithItems {
  id: string;
  name: string;
  description: string | null;
  status: RoomStatus;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
  items: ItemWithImages[];
  reservations?: Reservation[];
}

export interface RoomWithReservations extends Room {
  reservations: Reservation[];
}

export interface ReservationWithUser extends Reservation {
  user: User;
}

export interface ReservationWithRoom extends Reservation {
  room: Room;
}

export interface ReservationWithDetails extends Reservation {
  user: User;
  room: Room;
}

export interface NotificationWithUser extends Notification {
  user: User;
}

export interface NotificationTypeConfig {
  RESERVATION_CREATED: {
    color: "blue";
    text: "Nova Reserva";
    icon: "calendar-plus";
  };
  RESERVATION_APPROVED: {
    color: "green";
    text: "Reserva Aprovada";
    icon: "check-circle";
  };
  RESERVATION_REJECTED: {
    color: "red";
    text: "Reserva Rejeitada";
    icon: "x-circle";
  };
  RESERVATION_CANCELLED: {
    color: "orange";
    text: "Reserva Cancelada";
    icon: "calendar-x";
  };
  RESERVATION_CONFLICT: {
    color: "red";
    text: "Conflito de Horário";
    icon: "alert-triangle";
  };
  ROOM_STATUS_CHANGED: {
    color: "purple";
    text: "Status da Sala Alterado";
    icon: "building";
  };
  SYSTEM_ANNOUNCEMENT: {
    color: "gray";
    text: "Anúncio do Sistema";
    icon: "megaphone";
  };
}

export interface RoomStatusConfig {
  LIVRE: {
    color: "green";
    text: "Livre";
  };
  EM_USO: {
    color: "red";
    text: "Em Uso";
  };
  RESERVADO: {
    color: "yellow";
    text: "Reservado";
  };
}

export interface ReservationStatusConfig {
  PENDING: {
    color: "yellow";
    text: "Pendente";
  };
  APPROVED: {
    color: "green";
    text: "Aprovada";
  };
  REJECTED: {
    color: "red";
    text: "Rejeitada";
  };
  ACTIVE: {
    color: "blue";
    text: "Ativa";
  };
  CANCELLED: {
    color: "red";
    text: "Cancelada";
  };
  COMPLETED: {
    color: "gray";
    text: "Concluída";
  };
}

export type RoomStatusType = keyof RoomStatusConfig;
export type ReservationStatusType = keyof ReservationStatusConfig;
export type NotificationTypeType = keyof NotificationTypeConfig;

// Configuração de status das salas
export const ROOM_STATUS_CONFIG: RoomStatusConfig = {
  LIVRE: {
    color: "green",
    text: "Livre",
  },
  EM_USO: {
    color: "red",
    text: "Em Uso",
  },
  RESERVADO: {
    color: "yellow",
    text: "Reservado",
  },
};

// Configuração de status das reservas
export const RESERVATION_STATUS_CONFIG: ReservationStatusConfig = {
  PENDING: {
    color: "yellow",
    text: "Pendente",
  },
  APPROVED: {
    color: "green",
    text: "Aprovada",
  },
  REJECTED: {
    color: "red",
    text: "Rejeitada",
  },
  ACTIVE: {
    color: "blue",
    text: "Ativa",
  },
  CANCELLED: {
    color: "red",
    text: "Cancelada",
  },
  COMPLETED: {
    color: "gray",
    text: "Concluída",
  },
};

// Configuração de tipos de notificações
export const NOTIFICATION_TYPE_CONFIG: NotificationTypeConfig = {
  RESERVATION_CREATED: {
    color: "blue",
    text: "Nova Reserva",
    icon: "calendar-plus",
  },
  RESERVATION_APPROVED: {
    color: "green",
    text: "Reserva Aprovada",
    icon: "check-circle",
  },
  RESERVATION_REJECTED: {
    color: "red",
    text: "Reserva Rejeitada",
    icon: "x-circle",
  },
  RESERVATION_CANCELLED: {
    color: "orange",
    text: "Reserva Cancelada",
    icon: "calendar-x",
  },
  RESERVATION_CONFLICT: {
    color: "red",
    text: "Conflito de Horário",
    icon: "alert-triangle",
  },
  ROOM_STATUS_CHANGED: {
    color: "purple",
    text: "Status da Sala Alterado",
    icon: "building",
  },
  SYSTEM_ANNOUNCEMENT: {
    color: "gray",
    text: "Anúncio do Sistema",
    icon: "megaphone",
  },
};
