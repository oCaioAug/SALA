import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { API_CONFIG } from "../utils/config";
import { User } from "../types";

export interface ProfileUpdateData {
  name?: string;
  email?: string;
}

export interface ProfileSyncResult {
  success: boolean;
  user?: User;
  error?: string;
  fromCache?: boolean;
}

const PROFILE_CACHE_KEY = "user_profile_cache";
const PENDING_UPDATES_KEY = "profile_pending_updates";

export class ProfileService {
  private static api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: API_CONFIG.TIMEOUT,
  });

  private static token: string | null = null;

  /**
   * Obter token de autenticação atual
   */
  static getCurrentToken(): string | null {
    return this.token;
  }

  /**
   * Configurar token de autenticação
   */
  static setAuthToken(token: string) {
    this.token = token;
    this.api.defaults.headers.authorization = `Bearer ${token}`;
  }

  /**
   * Obter token de autenticação para mobile
   */
  static async getAuthToken(email: string): Promise<string | null> {
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/auth/mobile-token`,
        {
          email,
        }
      );

      const { token } = response.data;
      this.setAuthToken(token);
      return token;
    } catch (error) {
      console.error("Erro ao obter token:", error);
      return null;
    }
  }

  /**
   * Buscar perfil do usuário (primeiro tenta API, depois cache)
   */
  static async getUserProfile(userId: string): Promise<ProfileSyncResult> {
    try {
      console.log("🔍 Buscando perfil do usuário:", userId);

      // Tentar buscar da API primeiro
      try {
        const response = await this.api.get(`/users/${userId}`);
        const user: User = response.data;

        // Salvar no cache
        await this.saveToCache(user);

        console.log("✅ Perfil carregado da API:", user.email);
        return { success: true, user, fromCache: false };
      } catch (apiError) {
        console.log("⚠️  API indisponível, buscando cache...");

        // Se API falhou, tentar carregar do cache
        const cachedUser = await this.getFromCache();
        if (cachedUser) {
          console.log("📱 Perfil carregado do cache:", cachedUser.email);
          return { success: true, user: cachedUser, fromCache: true };
        }

        throw apiError;
      }
    } catch (error) {
      console.error("❌ Erro ao buscar perfil:", error);
      return { success: false, error: "Erro ao carregar perfil do usuário" };
    }
  }

  /**
   * Atualizar perfil do usuário (com suporte offline)
   */
  static async updateUserProfile(
    userId: string,
    updateData: ProfileUpdateData
  ): Promise<ProfileSyncResult> {
    try {
      console.log("🔄 Atualizando perfil:", userId, updateData);

      // Tentar enviar para API primeiro
      try {
        const response = await this.api.patch(`/users/${userId}`, updateData);
        const updatedUser: User = response.data;

        // Salvar no cache
        await this.saveToCache(updatedUser);

        // Limpar atualizações pendentes deste usuário
        await this.clearPendingUpdates(userId);

        console.log("✅ Perfil atualizado na API:", updatedUser.email);
        return { success: true, user: updatedUser, fromCache: false };
      } catch (apiError) {
        console.log("⚠️  API indisponível, salvando offline...");

        // Se API falhou, salvar como atualização pendente
        await this.savePendingUpdate(userId, updateData);

        // Atualizar cache local
        const cachedUser = await this.getFromCache();
        if (cachedUser) {
          const updatedUser = { ...cachedUser, ...updateData };
          await this.saveToCache(updatedUser);

          console.log("📱 Perfil atualizado offline:", updatedUser.email);
          return { success: true, user: updatedUser, fromCache: true };
        }

        throw apiError;
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      return { success: false, error: "Erro ao atualizar perfil" };
    }
  }

  /**
   * Sincronizar atualizações pendentes
   */
  static async syncPendingUpdates(): Promise<ProfileSyncResult[]> {
    try {
      console.log("🔄 Sincronizando atualizações pendentes...");

      const pendingUpdates = await this.getPendingUpdates();
      const results: ProfileSyncResult[] = [];

      for (const update of pendingUpdates) {
        try {
          const response = await this.api.patch(
            `/users/${update.userId}`,
            update.data
          );
          const updatedUser: User = response.data;

          // Atualizar cache
          await this.saveToCache(updatedUser);

          // Remover desta lista de pendentes
          await this.removePendingUpdate(update.userId);

          results.push({ success: true, user: updatedUser, fromCache: false });
          console.log("✅ Atualização sincronizada:", update.userId);
        } catch (syncError) {
          console.log("⚠️  Falha na sincronização:", update.userId);
          results.push({ success: false, error: "Falha na sincronização" });
        }
      }

      return results;
    } catch (error) {
      console.error("❌ Erro na sincronização:", error);
      return [{ success: false, error: "Erro na sincronização" }];
    }
  }

  /**
   * Verificar se há atualizações pendentes
   */
  static async hasPendingUpdates(): Promise<boolean> {
    const pendingUpdates = await this.getPendingUpdates();
    return pendingUpdates.length > 0;
  }

  /**
   * Limpar cache (logout)
   */
  static async clearCache(): Promise<void> {
    await AsyncStorage.multiRemove([PROFILE_CACHE_KEY, PENDING_UPDATES_KEY]);
  }

  // Métodos privados para gerenciamento de cache

  private static async saveToCache(user: User): Promise<void> {
    try {
      const cacheData = {
        user,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Erro ao salvar no cache:", error);
    }
  }

  private static async getFromCache(): Promise<User | null> {
    try {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return null;

      const { user, timestamp } = JSON.parse(cached);

      // Cache válido por 24 horas
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
        return null;
      }

      return user;
    } catch (error) {
      console.error("Erro ao ler cache:", error);
      return null;
    }
  }

  private static async savePendingUpdate(
    userId: string,
    updateData: ProfileUpdateData
  ): Promise<void> {
    try {
      const pendingUpdates = await this.getPendingUpdates();
      const existingIndex = pendingUpdates.findIndex(
        (update) => update.userId === userId
      );

      if (existingIndex >= 0) {
        // Merge com atualização existente
        pendingUpdates[existingIndex].data = {
          ...pendingUpdates[existingIndex].data,
          ...updateData,
        };
        pendingUpdates[existingIndex].timestamp = Date.now();
      } else {
        // Adicionar nova atualização pendente
        pendingUpdates.push({
          userId,
          data: updateData,
          timestamp: Date.now(),
        });
      }

      await AsyncStorage.setItem(
        PENDING_UPDATES_KEY,
        JSON.stringify(pendingUpdates)
      );
    } catch (error) {
      console.error("Erro ao salvar atualização pendente:", error);
    }
  }

  private static async getPendingUpdates(): Promise<
    Array<{
      userId: string;
      data: ProfileUpdateData;
      timestamp: number;
    }>
  > {
    try {
      const pending = await AsyncStorage.getItem(PENDING_UPDATES_KEY);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error("Erro ao ler atualizações pendentes:", error);
      return [];
    }
  }

  private static async removePendingUpdate(userId: string): Promise<void> {
    try {
      const pendingUpdates = await this.getPendingUpdates();
      const filtered = pendingUpdates.filter(
        (update) => update.userId !== userId
      );
      await AsyncStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Erro ao remover atualização pendente:", error);
    }
  }

  private static async clearPendingUpdates(userId: string): Promise<void> {
    await this.removePendingUpdate(userId);
  }
}
