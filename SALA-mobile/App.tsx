import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View, AppState, AppStateStatus } from "react-native";
import "react-native-gesture-handler";

import { AppProvider, useApp } from "./src/context/AppContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import TabNavigator from "./src/navigation/TabNavigator";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import { NotificationManager } from "./src/services/NotificationManager";

const AppContent: React.FC = () => {
  const { hasSeenWelcome, setHasSeenWelcome } = useApp();
  const { user, isLoading, signIn } = useAuth();
  const appState = useRef(AppState.currentState);

  // Reagendar lembretes quando o app volta ao foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        user
      ) {
        // App voltou ao foreground - reagendar lembretes
        console.log("📱 App voltou ao foreground - reagendando lembretes...");
        const notificationManager = NotificationManager.getInstance();
        notificationManager.rescheduleReminders().catch((error) => {
          console.error("Erro ao reagendar lembretes:", error);
        });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={signIn} />;
  }

  if (!hasSeenWelcome) {
    return <WelcomeScreen onGetStarted={() => setHasSeenWelcome(true)} />;
  }

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style="light" backgroundColor="#3B82F6" />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
