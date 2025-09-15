import axios from "axios";
import { Room, Reservation, ReservationWithDetails } from "../types";
import { API_CONFIG } from "../utils/config";

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_CONFIG.TIMEOUT,
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
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
      const reservations = await this.getReservations();
      const roomReservations = reservations.filter(
        (reservation) =>
          reservation.roomId === roomId && reservation.status === "ACTIVE"
      );

      const start = new Date(startTime);
      const end = new Date(endTime);

      return !roomReservations.some((reservation) => {
        const reservationStart = new Date(reservation.startTime);
        const reservationEnd = new Date(reservation.endTime);

        return (
          (start >= reservationStart && start < reservationEnd) ||
          (end > reservationStart && end <= reservationEnd) ||
          (start <= reservationStart && end >= reservationEnd)
        );
      });
    } catch (error) {
      throw new Error("Erro ao verificar disponibilidade");
    }
  }
}

export default ApiService;
