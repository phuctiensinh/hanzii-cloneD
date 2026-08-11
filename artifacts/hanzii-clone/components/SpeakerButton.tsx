import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Platform, StyleProp, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";

import colors from "@/constants/colors";
import { useSpeech } from "@/hooks/useSpeech";

interface Props {
  text: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function SpeakerButton({ text, size = 18, color = colors.light.primary, style }: Props) {
  const { speak } = useSpeech();
  const [speaking, setSpeaking] = useState(false);

  const handlePress = (e: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1200);
  };

  return (
    <TouchableOpacity
      style={[styles.btn, speaking && styles.btnActive, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather
        name={speaking ? "volume-2" : "volume-1"}
        size={size}
        color={speaking ? colors.light.primaryForeground : color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  btnActive: {
    backgroundColor: colors.light.primary,
    borderColor: colors.light.primary,
  },
});
