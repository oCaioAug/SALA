import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import { API_CONFIG } from "../src/utils/config";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleUserData {
  id: string;
  email: string;
  name: string | null;
  photo?: string | null;
}

interface UserSyncRequest {
  googleId: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface SyncedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

class AuthService {
  private static instance: AuthService;
  private isConfigured = false;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      GoogleSignin.configure({
        webClientId:
          "199539496823-sgm07ecndbi76o04c4d95ogg381onmdr.apps.googleusercontent.com",
        offlineAccess: false,
      });

      this.isConfigured = true;
      console.log("✅ Google Sign-In configurado");
    } catch (error) {
      console.error("❌ Erro ao configurar Google Sign-In:", error);
      throw error;
    }
  }

  async signIn(): Promise<User | null> {
    try {
      if (!this.isConfigured) {
        await this.configure();
      }

      // Verificar Google Play Services
      await GoogleSignin.hasPlayServices();

      // Fazer login
      const result = await GoogleSignin.signIn();
      const googleUser = result.data?.user;

      if (!googleUser) {
        throw new Error("Dados do usuário não encontrados");
      }

      // Sincronizar usuário com a API backend
      const apiUser = await this.syncUserWithAPI(googleUser);

      const user: User = {
        id: apiUser.id, // Usar ID retornado pela API
        email: apiUser.email,
        name: apiUser.name || googleUser.name || "Usuário",
        picture: apiUser.image || googleUser.photo || undefined,
      };

      console.log("👤 Dados do usuário mapeados:", {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        apiUserImage: apiUser.image,
        googleUserPhoto: googleUser.photo,
      });

      // Salvar dados do usuário
      await AsyncStorage.setItem("@user", JSON.stringify(user));

      console.log("✅ Login realizado com sucesso");
      return user;
    } catch (error: any) {
      console.error("❌ Erro durante o login:", error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem("@user");
      console.log("✅ Logout realizado com sucesso");
    } catch (error) {
      console.error("❌ Erro durante logout:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem("@user");
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar usuário atual:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Sincroniza dados do usuário Google com a API backend
   * @param googleUser - Dados do usuário retornados pelo Google Sign-In
   * @returns Promise com dados do usuário sincronizado
   */
  private async syncUserWithAPI(
    googleUser: GoogleUserData
  ): Promise<SyncedUser> {
    const syncData: UserSyncRequest = {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.photo || null,
    };

    try {
      console.log("🔄 Sincronizando usuário com API...", {
        email: syncData.email,
        name: syncData.name,
      });

      const api = axios.create({
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await api.post<SyncedUser>("/users/sync", syncData);

      const apiUser = response.data;
      console.log("✅ Usuário sincronizado com API:", {
        id: apiUser.id,
        email: apiUser.email,
      });

      return apiUser;
    } catch (error) {
      return this.handleSyncError(error, googleUser);
    }
  }

  /**
   * Trata erros de sincronização com fallback para dados do Google
   * @param error - Erro capturado durante sincronização
   * @param googleUser - Dados originais do Google como fallback
   * @returns Dados do usuário (fallback)
   */
  private handleSyncError(
    error: unknown,
    googleUser: GoogleUserData
  ): SyncedUser {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      console.error("❌ Erro HTTP ao sincronizar usuário:", {
        status,
        message,
        url: error.config?.url,
      });

      // Log específico para diferentes tipos de erro
      if (status === 400) {
        console.error("📝 Dados inválidos enviados para API");
      } else if (status === 500) {
        console.error("🚨 Erro interno do servidor");
      } else if (error.code === "ECONNABORTED") {
        console.error("⏱️ Timeout na requisição");
      } else if (error.code === "NETWORK_ERROR") {
        console.error("🌐 Erro de conectividade de rede");
      }
    } else {
      console.error("❌ Erro desconhecido ao sincronizar usuário:", error);
    }

    console.log("🔄 Usando dados do Google como fallback");

    // Retorna dados do Google como fallback
    return {
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name || "Usuário",
      image: googleUser.photo || null,
      role: "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async registerPushToken(token: string, deviceType?: string): Promise<boolean> {
    try {
      console.log('🔔 === INICIO registerPushToken ===');
      console.log('📱 Token recebido:', token);
      console.log('🔧 Device Type:', deviceType);
      
      // Obter dados do usuário atual
      const user = await this.getCurrentUser();
      console.log('👤 Usuario atual:', user ? user.id : 'NENHUM');
      
      if (!user) {
        console.error('❌ Usuário não autenticado');
        return false;
      }

      const payload = {
        token,
        deviceType: deviceType || 'mobile',
        userId: user.id
      };

      console.log('� Payload que será enviado:', payload);
      console.log('🌐 URL da API:', `${API_CONFIG.BASE_URL}/api/push-tokens`);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/push-tokens`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Dados da resposta:', response.data);

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Push token registrado com sucesso!');
        return true;
      }

      console.error('❌ Status inesperado:', response.status);
      return false;
    } catch (error) {
      console.error('❌ === ERRO no registerPushToken ===');
      
      if (axios.isAxiosError(error)) {
        console.error('📡 Erro HTTP:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url
        });
      } else {
        console.error('🚨 Erro genérico:', error);
      }
      
      console.error('❌ === FIM ERRO ===');
      return false;
    }
  }

  async unregisterPushToken(token: string): Promise<boolean> {
    try {
      console.log('🚫 Removendo push token do backend...');
      
      // Obter dados do usuário atual
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('❌ Usuário não autenticado');
        return false;
      }

      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}/api/push-tokens?token=${encodeURIComponent(token)}`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: API_CONFIG.TIMEOUT
        }
      );

      console.log('📡 Resposta da API:', response.status, response.data);

      if (response.status === 200) {
        console.log('✅ Push token removido com sucesso');
        return true;
      }

      console.error('❌ Falha ao remover push token:', response.status);
      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Erro HTTP ao remover push token:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      } else {
        console.error('❌ Erro ao remover push token:', error);
      }
      return false;
    }
  }
}

export default AuthService;
