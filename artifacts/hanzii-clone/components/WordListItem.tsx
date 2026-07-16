import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import colors from "@/constants/colors";
import { HSKBadge } from "./HSKBadge";
import { SpeakerButton } from "./SpeakerButton";
import { Word } from "@/types";

interface Props {
  word: Word;
  onPress: () => void;
  isLearned?: boolean;
  isSaved?: boolean;
}

export function WordListItem({ word, onPress, isLearned, isSaved }: Props) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.charBox}>
        <Text style={styles.char}>{word.character}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.pinyin}>{word.pinyin}</Text>
        <Text style={styles.meaning} numberOfLines={1}>{word.meaning}</Text>
        <HSKBadge level={word.hskLevel} size="sm" />
      </View>
      <View style={styles.icons}>
        {isSaved && <Feather name="bookmark" size={14} color={colors.light.primary} style={styles.icon} />}
        {isLearned && <Feather name="check-circle" size={14} color="#43A047" style={styles.icon} />}
        <SpeakerButton text={word.character} size={16} />
        <Feather name="chevron-right" size={16} color={colors.light.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  charBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.light.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  char: {
    fontSize: 26,
    color: colors.light.primary,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  pinyin: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
  },
  meaning: {
    fontSize: 15,
    color: colors.light.foreground,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 8,
  },
  icon: { marginRight: 2 },
});
