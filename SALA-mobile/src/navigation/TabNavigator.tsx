import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

// Screens
import RoomListScreen from "../screens/RoomListScreen";
import RoomDetailsScreen from "../screens/RoomDetailsScreen";
import CreateReservationScreen from "../screens/CreateReservationScreen";
import MyReservationsScreen from "../screens/MyReservationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

import { RootStackParamList, BottomTabParamList } from "../types";

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Stack Navigator para Salas
const RoomsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#3B82F6",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="RoomList"
        component={RoomListScreen}
        options={{ title: "Salas Disponíveis" }}
      />
      <Stack.Screen
        name="RoomDetails"
        component={RoomDetailsScreen}
        options={{ title: "Detalhes da Sala" }}
      />
      <Stack.Screen
        name="CreateReservation"
        component={CreateReservationScreen}
        options={{ title: "Nova Reserva" }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator para Profile
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#3B82F6",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: "Meu Perfil" }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: "Editar Perfil",
          headerShown: false, // A tela tem seu próprio header
        }}
      />
    </Stack.Navigator>
  );
};

// Tab Navigator Principal
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Rooms") {
            iconName = focused ? "business" : "business-outline";
          } else if (route.name === "Reservations") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Rooms"
        component={RoomsStack}
        options={{ tabBarLabel: "Salas" }}
      />
      <Tab.Screen
        name="Reservations"
        component={MyReservationsScreen}
        options={{
          tabBarLabel: "Reservas",
          headerShown: true,
          headerTitle: "Minhas Reservas",
          headerStyle: {
            backgroundColor: "#3B82F6",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: "Perfil",
          headerShown: false, // ProfileStack tem seus próprios headers
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
