// Tipos para o sistema SALA

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface Item {
  id: string;
  name: string;
  specifications: string[];
  quantity: number;
  icon: string;
  roomId?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  status: 'livre' | 'em-uso' | 'reservado';
  items: Item[];
  reservation?: Reservation;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  startTime: string;
  endTime: string;
  purpose?: string;
}

export interface RoomStatus {
  livre: {
    color: 'green';
    text: 'Livre';
  };
  'em-uso': {
    color: 'red';
    text: 'Em Uso';
  };
  reservado: {
    color: 'yellow';
    text: 'Reservado';
  };
}

export type RoomStatusType = keyof RoomStatus;
