import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color = "#3B82F6",
  message = "Carregando...",
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});

export default LoadingSpinner;
