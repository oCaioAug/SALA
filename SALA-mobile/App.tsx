import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import "react-native-gesture-handler";

import { AppProvider, useApp } from "./src/context/AppContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import TabNavigator from "./src/navigation/TabNavigator";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";

const AppContent: React.FC = () => {
  const { hasSeenWelcome, setHasSeenWelcome } = useApp();
  const { user, isLoading, signIn } = useAuth();

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
