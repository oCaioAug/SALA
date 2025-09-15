import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ROOM_STATUS_CONFIG } from "../types";

interface StatusBadgeProps {
  status: keyof typeof ROOM_STATUS_CONFIG;
  size?: "small" | "medium" | "large";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "medium",
}) => {
  const config = ROOM_STATUS_CONFIG[status];

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: sizeStyles[size].fontSize,
          },
        ]}
      >
        {config.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
});

export default StatusBadge;
