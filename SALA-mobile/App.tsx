import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-gesture-handler";

import { AppProvider, useApp } from "./src/context/AppContext";
import TabNavigator from "./src/navigation/TabNavigator";
import WelcomeScreen from "./src/screens/WelcomeScreen";

const AppContent: React.FC = () => {
  const { hasSeenWelcome, setHasSeenWelcome } = useApp();

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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
