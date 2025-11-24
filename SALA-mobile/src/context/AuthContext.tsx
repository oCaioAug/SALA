import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AuthService, { User } from "../../services/AuthService";
import { ProfileService } from "../services/ProfileService";
import { NotificationManager } from "../services/NotificationManager";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = AuthService.getInstance();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Primeiro, configurar o GoogleAuthService
      await authService.configure();
      console.log("✅ GoogleAuthService configurado no AuthContext");

      // Depois verificar o status de autenticação
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Carregar perfil completo da API para obter avatar mais recente
        if (currentUser.email) {
          const token = await ProfileService.getAuthToken(currentUser.email);
          if (token) {
            console.log("✅ Token configurado para ProfileService");

            // Tentar carregar perfil da API para obter dados mais recentes
            const profileResult = await ProfileService.getUserProfile(
              currentUser.id
            );
            if (profileResult.success && profileResult.user) {
              // Usar dados mais recentes da API
              const updatedUser = {
                ...currentUser,
                name: profileResult.user.name || currentUser.name,
                avatar: profileResult.user.image, // Mapear 'image' do banco para 'avatar' do app
              };
              setUser(updatedUser);
              
              // Inicializar sistema de notificações
              try {
                const notificationManager = NotificationManager.getInstance();
                await notificationManager.initialize(updatedUser.id);
                console.log("🔔 Sistema de notificações inicializado no initializeAuth");
              } catch (error) {
                console.error("❌ Erro ao inicializar notificações no initializeAuth:", error);
              }
            } else {
              setUser(currentUser);
              
              // Inicializar sistema de notificações mesmo sem perfil da API
              try {
                const notificationManager = NotificationManager.getInstance();
                await notificationManager.initialize(currentUser.id);
                console.log("🔔 Sistema de notificações inicializado no initializeAuth (sem perfil API)");
              } catch (error) {
                console.error("❌ Erro ao inicializar notificações no initializeAuth:", error);
              }
            }
          } else {
            console.log("⚠️  Falha ao obter token para ProfileService");
            setUser(currentUser);
          }
        } else {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData: User) => {
    setUser(userData);

    // Configurar token para ProfileService
    if (userData.email) {
      const token = await ProfileService.getAuthToken(userData.email);
      if (token) {
        console.log("✅ Token configurado para ProfileService após login");
        
        // Inicializar sistema de notificações
        try {
          const notificationManager = NotificationManager.getInstance();
          await notificationManager.initialize(userData.id);
          console.log("🔔 Sistema de notificações inicializado");
        } catch (error) {
          console.error("❌ Erro ao inicializar notificações:", error);
        }
      }
    }
  };

  const signOut = async () => {
    try {
      // Finalizar sistema de notificações
      try {
        const notificationManager = NotificationManager.getInstance();
        notificationManager.destroy();
        console.log("🔔 Sistema de notificações finalizado");
      } catch (error) {
        console.error("❌ Erro ao finalizar notificações:", error);
      }

      await authService.signOut();
      await ProfileService.clearCache(); // Limpar cache do ProfileService
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
