import axios from "axios";
import { Room, Reservation, ReservationWithDetails } from "../types";
import { API_CONFIG } from "../utils/config";

// Log da configuração da API para debug
console.log("API Configuration:", {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_CONFIG.TIMEOUT,
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error("API Error - Response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error("API Error - No Response:", {
        request: error.request,
        message: error.message,
        baseURL: API_CONFIG.BASE_URL,
      });
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error("API Error - Setup:", error.message);
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  // Rooms
  static async getRooms(): Promise<Room[]> {
    try {
      const response = await api.get("/rooms");
      return response.data;
    } catch (error) {
      throw new Error("Erro ao carregar salas");
    }
  }

  static async getRoomById(id: string): Promise<Room> {
    try {
      const response = await api.get(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao carregar detalhes da sala");
    }
  }

  static async getRoomItems(roomId: string) {
    try {
      const response = await api.get(`/rooms/${roomId}/items`);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao carregar itens da sala");
    }
  }

  // Users
  static async getUsers() {
    try {
      const response = await api.get("/users");
      return response.data;
    } catch (error) {
      throw new Error("Erro ao carregar usuários");
    }
  }

  // Reservations
  static async getReservations(): Promise<ReservationWithDetails[]> {
    try {
      const response = await api.get("/reservations");
      return response.data;
    } catch (error) {
      throw new Error("Erro ao carregar reservas");
    }
  }

  static async createReservation(reservationData: {
    userId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  }): Promise<Reservation> {
    try {
      const response = await api.post("/reservations", reservationData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("Sala não disponível no horário selecionado");
      }
      throw new Error("Erro ao criar reserva");
    }
  }

  static async cancelReservation(reservationId: string): Promise<void> {
    try {
      await api.delete(`/reservations/${reservationId}`);
    } catch (error) {
      throw new Error("Erro ao cancelar reserva");
    }
  }

  // Utility methods
  static async checkRoomAvailability(
    roomId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      console.log("Verificando disponibilidade da sala:", {
        roomId,
        startTime,
        endTime,
      });

      const reservations = await this.getReservations();
      console.log("Total de reservas encontradas:", reservations.length);

      const roomReservations = reservations.filter(
        (reservation) =>
          reservation.roomId === roomId && reservation.status === "ACTIVE"
      );

      console.log("Reservas da sala específica:", roomReservations.length);
      console.log(
        "Reservas da sala:",
        roomReservations.map((r) => ({
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          status: r.status,
        }))
      );

      const start = new Date(startTime);
      const end = new Date(endTime);

      const hasConflict = roomReservations.some((reservation) => {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);

        const conflict =
          (start >= reservationStart && start < reservationEnd) ||
          (end > reservationStart && end <= reservationEnd) ||
          (start <= reservationStart && end >= reservationEnd);

        if (conflict) {
          console.log("Conflito encontrado com reserva:", {
            reservationId: reservation.id,
            reservationStart: reservationStart.toISOString(),
            reservationEnd: reservationEnd.toISOString(),
            newStart: start.toISOString(),
            newEnd: end.toISOString(),
          });
        }

        return conflict;
      });

      const isAvailable = !hasConflict;
      console.log("Sala disponível:", isAvailable);

      return isAvailable;
    } catch (error) {
      throw new Error("Erro ao verificar disponibilidade");
    }
  }

  // Método para testar conectividade
  static async testConnection(): Promise<boolean> {
    try {
      console.log("Testando conectividade com:", API_CONFIG.BASE_URL);
      const response = await api.get("/rooms");
      console.log("Conectividade OK - Resposta recebida:", response.status);
      return true;
    } catch (error) {
      console.error("Erro de conectividade:", error);
      return false;
    }
  }
}

export default ApiService;
