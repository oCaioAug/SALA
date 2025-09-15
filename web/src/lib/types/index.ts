// Tipos para o sistema SALA
import { User, Room, Item, Reservation, Role, RoomStatus, ReservationStatus } from '@prisma/client'

export type { User, Room, Item, Reservation, Role, RoomStatus, ReservationStatus }

// Tipos estendidos para o frontend
export interface RoomWithItems {
  id: string
  name: string
  description: string | null
  status: RoomStatus
  capacity: number | null
  createdAt: Date
  updatedAt: Date
  items: Item[]
  reservations?: Reservation[]
}

export interface RoomWithReservations extends Room {
  reservations: Reservation[]
}

export interface ReservationWithUser extends Reservation {
  user: User
}

export interface ReservationWithRoom extends Reservation {
  room: Room
}

export interface RoomStatusConfig {
  LIVRE: {
    color: 'green';
    text: 'Livre';
  };
  EM_USO: {
    color: 'red';
    text: 'Em Uso';
  };
  RESERVADO: {
    color: 'yellow';
    text: 'Reservado';
  };
}

export type RoomStatusType = keyof RoomStatusConfig;

// Configuração de status das salas
export const ROOM_STATUS_CONFIG: RoomStatusConfig = {
  LIVRE: {
    color: 'green',
    text: 'Livre'
  },
  EM_USO: {
    color: 'red',
    text: 'Em Uso'
  },
  RESERVADO: {
    color: 'yellow',
    text: 'Reservado'
  }
};
