import axios from "axios";
import {
  Room,
  Reservation,
  ReservationWithDetails,
  User,
  ReservationStatusEnum,
} from "../types";
import { API_CONFIG } from "../utils/config";
import { ProfileService } from "./ProfileService";

// Interfaces para API
export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

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

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    // Buscar token do ProfileService
    const token = ProfileService.getCurrentToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Token de autenticação adicionado à requisição");
    } else {
      console.warn("⚠️  Nenhum token de autenticação encontrado para:", config.url);
    }
    
    console.log(`📡 Requisição: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

  static async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao carregar dados do usuário");
    }
  }

  static async updateUser(
    userId: string,
    data: ProfileUpdateData
  ): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}`, data);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao atualizar usuário");
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

  static async getUserReservations(
    userId: string
  ): Promise<ReservationWithDetails[]> {
    try {
      console.log("🔍 Buscando reservas para userId:", userId);
      console.log("🔗 URL completa:", `${API_CONFIG.BASE_URL}/reservations?userId=${userId}`);
      
      const response = await api.get(`/reservations?userId=${userId}`);
      console.log("📡 Resposta da API getUserReservations:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erro na API getUserReservations:", error);
      
      // Log detalhado do erro
      if (error.response) {
        console.error("   - Status:", error.response.status);
        console.error("   - Data:", error.response.data);
      } else if (error.request) {
        console.error("   - Sem resposta do servidor");
        console.error("   - URL tentada:", `${API_CONFIG.BASE_URL}/reservations?userId=${userId}`);
        console.error("   - Verifique se o backend está rodando e acessível");
      } else {
        console.error("   - Erro ao configurar requisição:", error.message);
      }
      
      throw new Error("Erro ao carregar reservas do usuário");
    }
  }

  static async createReservation(reservationData: {
    userId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
    isRecurring?: boolean;
    recurringPattern?: "DAILY" | "WEEKLY" | "MONTHLY";
    recurringDaysOfWeek?: number[];
    recurringEndDate?: string;
  }): Promise<Reservation | { reservations: Reservation[]; isRecurring: boolean; recurringInstances: number; parentReservation: Reservation }> {
    try {
      const response = await api.post("/reservations", reservationData);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error("Sala não disponível no horário selecionado");
      }
      const errorMessage = error.response?.data?.error || "Erro ao criar reserva";
      throw new Error(errorMessage);
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
          reservation.roomId === roomId &&
          reservation.status === ReservationStatusEnum.ACTIVE
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

  // Novo método para verificar status atual da sala
  static async getRoomStatus(roomId: string) {
    try {
      const response = await api.get(`/rooms/${roomId}/status`);
      return response.data;
    } catch (error) {
      throw new Error("Erro ao verificar status da sala");
    }
  }

  // Método para sincronizar usuário do Google Auth com a API
  static async syncUser(googleUser: any) {
    try {
      const response = await api.post("/users/sync", {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
      });
      return response.data;
    } catch (error) {
      throw new Error("Erro ao sincronizar usuário");
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
