import React, { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";

const DebugScreen = () => {
  useEffect(() => {
    console.log("=== DEBUG OAUTH CONFIGURATION ===");
    console.log("Constants.expoConfig?.extra:", Constants.expoConfig?.extra);
    console.log(
      "Google Client ID:",
      Constants.expoConfig?.extra?.googleClientId
    );

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "sala",
    });
    console.log("Redirect URI:", redirectUri);
    console.log("==================================");
  }, []);

  const clientId = Constants.expoConfig?.extra?.googleClientId;
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "sala",
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OAuth Debug Info</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Google Client ID:</Text>
        <Text style={styles.value}>{clientId || "NÃO CONFIGURADO"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Redirect URI:</Text>
        <Text style={styles.value}>{redirectUri}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Scheme:</Text>
        <Text style={styles.value}>sala</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Constants.expoConfig?.extra:</Text>
        <Text style={styles.value}>
          {JSON.stringify(Constants.expoConfig?.extra, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
});

export default DebugScreen;
