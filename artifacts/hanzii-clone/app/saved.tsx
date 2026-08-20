import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { getWordById } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";
import { useCustomWords } from "@/context/CustomWordsContext";
import { SpeakerButton } from "@/components/SpeakerButton";
import { HSKBadge } from "@/components/HSKBadge";
import { Word } from "@/types";

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { savedWords, toggleSaved } = useLearning();
  const { customWords } = useCustomWords();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  // Resolve word objects from IDs (look in both HSK data and custom words)
  const words: Word[] = savedWords
    .map((id) => getWordById(id) ?? customWords.find((w) => w.id === id))
    .filter((w): w is Word => Boolean(w));

  const handleUnsave = (wordId: string) => {
    toggleSaved(wordId);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>Từ đã lưu</Text>
        <View style={{ width: 40 }} />
      </View>

      {words.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="bookmark" size={40} color={colors.light.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có từ nào được lưu</Text>
          <Text style={styles.emptyDesc}>
            Bấm vào icon 🔖 trên trang chi tiết của từ để lưu từ vào đây.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLabel}>{words.length} từ đã lưu</Text>
          {words.map((word) => (
            <TouchableOpacity
              key={word.id}
              style={styles.wordCard}
              onPress={() =>
                router.push({ pathname: "/character/[id]", params: { id: word.id } })
              }
              activeOpacity={0.8}
            >
              <View style={styles.wordMain}>
                <Text style={styles.character}>{word.character}</Text>
                <View style={styles.wordInfo}>
                  <View style={styles.wordInfoTop}>
                    <Text style={styles.pinyin}>{word.pinyin}</Text>
                    <HSKBadge level={word.hskLevel} />
                  </View>
                  <Text style={styles.meaning} numberOfLines={2}>{word.meaning}</Text>
                </View>
              </View>
              <View style={styles.wordActions}>
                <SpeakerButton text={word.character} size={16} />
                <TouchableOpacity
                  style={styles.unsaveBtn}
                  onPress={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                    handleUnsave(word.id);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="bookmark" size={18} color={colors.light.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  countLabel: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  wordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 12,
  },
  wordMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  character: {
    fontSize: 42,
    color: colors.light.primary,
    fontWeight: "700",
    lineHeight: 50,
    width: 52,
    textAlign: "center",
  },
  wordInfo: { flex: 1, gap: 4 },
  wordInfoTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  pinyin: { fontSize: 14, color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  meaning: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  wordActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  unsaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.light.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  emptyDesc: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
