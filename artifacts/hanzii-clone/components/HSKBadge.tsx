import React from "react";
import { StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

interface Props {
  level: number;
  size?: "sm" | "md";
}

export function HSKBadge({ level, size = "md" }: Props) {
  const color = colors.hsk[(level - 1) % colors.hsk.length];
  const isSmall = size === "sm";
  return (
    <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color + "40" }, isSmall && styles.sm]}>
      <Text style={[styles.text, { color }, isSmall && styles.smText]}>HSK {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  smText: {
    fontSize: 10,
  },
});
