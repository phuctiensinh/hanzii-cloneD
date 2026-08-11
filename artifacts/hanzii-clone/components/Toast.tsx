import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";

export type ToastType = "success" | "info" | "error";

interface Props {
  visible: boolean;
  message: string;
  type?: ToastType;
  /** Duration in ms before auto-dismiss; parent should set visible=false after this */
  duration?: number;
}

const TYPE_CONFIG: Record<ToastType, { icon: string; bg: string; iconColor: string }> = {
  success: { icon: "check-circle", bg: "#1B5E20", iconColor: "#A5D6A7" },
  info:    { icon: "bookmark",    bg: colors.light.primary, iconColor: "#FFCDD2" },
  error:   { icon: "x-circle",   bg: "#B71C1C", iconColor: "#FFCCD5" },
};

export function Toast({ visible, message, type = "success" }: Props) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.bg },
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Feather name={config.icon as any} size={18} color={config.iconColor} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 100 : 120,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
