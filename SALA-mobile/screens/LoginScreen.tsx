import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AuthService, { User } from "../services/AuthService";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const authService = AuthService.getInstance();

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        onLogin(user);
      }
    } catch (error) {
      console.error("Error checking existing auth:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log("🎯 Iniciando processo de login...");

      const user = await authService.signIn();
      if (user) {
        console.log("✅ Login bem-sucedido, redirecionando...");
        onLogin(user);
      } else {
        Alert.alert("Erro", "Não foi possível fazer login. Tente novamente.");
      }
    } catch (error: any) {
      console.error("❌ Erro no login:", error);

      let errorMessage = "Ocorreu um erro durante o login.";

      if (error.message?.includes("Client ID não configurado")) {
        errorMessage =
          "Google Client ID não configurado. Verifique o app.json.";
      } else if (error.message?.includes("Play Services")) {
        errorMessage = "Google Play Services não disponível neste dispositivo.";
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>S.A.L.A</Text>
        <Text style={styles.subtitle}>Sistema de Gestão de Salas</Text>
      </View>

      <View style={styles.loginSection}>
        <Text style={styles.welcomeText}>Bem-vindo!</Text>
        <Text style={styles.instructionText}>
          Faça login para acessar o sistema
        </Text>

        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#ffffff" />
              <Text style={styles.googleButtonText}>Entrar com Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Ao fazer login, você concorda com nossos termos de uso
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  loginSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 16,
  },
});

export default LoginScreen;
