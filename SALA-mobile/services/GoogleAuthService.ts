import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isConfigured = false;

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async configure(): Promise<void> {
    if (this.isConfigured) return;

    try {
      console.log(
        "🔍 Debug - Constants.expoConfig:",
        JSON.stringify(Constants.expoConfig?.extra, null, 2)
      );
      let webClientId = Constants.expoConfig?.extra?.googleSignIn?.webClientId;
      let androidClientId =
        Constants.expoConfig?.extra?.googleSignIn?.androidClientId;

      // Fallback para desenvolvimento se não conseguir acessar via Constants
      if (!webClientId) {
        webClientId =
          "199539496823-nbechbht00i7cv6gc99df5f6p0coq6vp.apps.googleusercontent.com";
        console.log("🔄 Usando Web Client ID de fallback para desenvolvimento");
      }

      if (!webClientId || webClientId === "your-google-client-id") {
        console.warn("⚠️ Google Web Client ID não configurado no app.json");
        throw new Error("Google Web Client ID não configurado");
      }

      console.log(
        "🔧 Configurando Google Sign-In com Web Client ID:",
        webClientId
      );

      GoogleSignin.configure({
        webClientId: webClientId,
        offlineAccess: false, // Mudança: false para debug
        scopes: ["email", "profile"], // Mudança: scopes mais simples
      });

      this.isConfigured = true;
      console.log("✅ Google Sign-In configurado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao configurar Google Sign-In:", error);
      throw error;
    }
  }

  async signIn(): Promise<User | null> {
    try {
      console.log("🚀 Iniciando processo de login...");

      if (!this.isConfigured) {
        await this.configure();
      }

      // Verificar se o Google Play Services está disponível
      await GoogleSignin.hasPlayServices();
      console.log("✅ Google Play Services disponível");

      // Fazer o sign-in
      console.log("📱 Abrindo tela de login do Google...");
      const userInfo = await GoogleSignin.signIn();
      console.log("✅ Login realizado com sucesso:", userInfo.data?.user);

      if (!userInfo.data?.user) {
        throw new Error("Dados do usuário não encontrados na resposta");
      }

      const googleUser = userInfo.data.user;
      const user: User = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || "",
        picture: googleUser.photo || undefined,
        givenName: googleUser.givenName || undefined,
        familyName: googleUser.familyName || undefined,
      };

      // Salvar no AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("accessToken", userInfo.data?.idToken || "");

      console.log("✅ Dados do usuário salvos localmente");
      return user;
    } catch (error: any) {
      console.error("❌ Erro durante o login:", error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("ℹ️ Login cancelado pelo usuário");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("ℹ️ Login já em progresso");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error("❌ Google Play Services não disponível");
      } else {
        console.error("❌ Erro desconhecido:", error.message);
      }

      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log("🚪 Fazendo logout...");

      if (!this.isConfigured) {
        await this.configure();
      }

      await GoogleSignin.signOut();

      // Limpar AsyncStorage
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("accessToken");

      console.log("✅ Logout realizado com sucesso");
    } catch (error) {
      console.error("❌ Erro durante logout:", error);

      // Mesmo com erro, limpar dados locais
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("accessToken");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Primeiro, verificar se há dados no AsyncStorage
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        console.log("👤 Usuário encontrado no storage local:", user.email);
        return user;
      }

      // Se não há dados locais, verificar se está logado no Google
      if (!this.isConfigured) {
        await this.configure();
      }

      try {
        console.log("🔍 Verificando se há usuário logado no Google...");
        const userInfo = await GoogleSignin.getCurrentUser();

        if (userInfo) {
          console.log(
            "🔍 Usuário logado no Google encontrado:",
            userInfo.email
          );
          const user: User = {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || "",
            picture: userInfo.photo || undefined,
            givenName: userInfo.givenName || undefined,
            familyName: userInfo.familyName || undefined,
          };

          // Salvar dados recuperados
          await AsyncStorage.setItem("user", JSON.stringify(user));
          return user;
        }
      } catch (getCurrentUserError) {
        console.log("ℹ️ Nenhum usuário logado no Google");
      }

      console.log("ℹ️ Nenhum usuário logado encontrado");
      return null;
    } catch (error) {
      console.error("❌ Erro ao obter usuário atual:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error("❌ Erro ao verificar autenticação:", error);
      return false;
    }
  }

  async revokeAccess(): Promise<void> {
    try {
      console.log("🗑️ Revogando acesso...");

      if (!this.isConfigured) {
        await this.configure();
      }

      await GoogleSignin.revokeAccess();
      await this.signOut();

      console.log("✅ Acesso revogado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao revogar acesso:", error);
    }
  }

  // Método para debug
  async getGoogleSignInStatus(): Promise<void> {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      console.log(
        "🔍 Status Google Sign-In:",
        isSignedIn ? "Logado" : "Não logado"
      );

      if (isSignedIn) {
        const currentUser = await GoogleSignin.getCurrentUser();
        console.log("👤 Usuário atual do Google:", currentUser?.user.email);
      }

      const localUser = await AsyncStorage.getItem("user");
      console.log(
        "💾 Usuário no storage local:",
        localUser ? JSON.parse(localUser).email : "Nenhum"
      );
    } catch (error) {
      console.error("❌ Erro ao verificar status:", error);
    }
  }
}

export default GoogleAuthService;
