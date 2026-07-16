import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { getWordsByHSK } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";
import { WordListItem } from "@/components/WordListItem";
import { Word } from "@/types";

export default function HSKLevelScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const lvl = Number(level);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved, isLearned } = useLearning();
  const [query, setQuery] = useState("");

  const allWords = getWordsByHSK(lvl);
  const words = query.trim()
    ? allWords.filter(
        (w) =>
          w.character.includes(query) ||
          w.pinyin.toLowerCase().includes(query.toLowerCase()) ||
          w.meaning.toLowerCase().includes(query.toLowerCase())
      )
    : allWords;

  const color = colors.hsk[(lvl - 1) % colors.hsk.length];
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const goToChar = (word: Word) =>
    router.push({ pathname: "/character/[id]", params: { id: word.id } });

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.title}>HSK {lvl}</Text>
          <Text style={styles.subtitle}>{allWords.length} từ vựng</Text>
        </View>
        <TouchableOpacity
          style={[styles.studyBtn, { backgroundColor: color }]}
          onPress={() => router.push({ pathname: "/study/[level]", params: { level: lvl } })}
        >
          <Feather name="play" size={14} color="#fff" />
          <Text style={styles.studyBtnText}>Học</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.light.mutedForeground} />
          <TextInput
            style={styles.input}
            placeholder="Tìm trong HSK..."
            placeholderTextColor={colors.light.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={16} color={colors.light.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={words}
        keyExtractor={(w) => w.id}
        renderItem={({ item }) => (
          <WordListItem
            word={item}
            onPress={() => goToChar(item)}
            isSaved={isSaved(item.id)}
            isLearned={isLearned(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Không tìm thấy từ nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
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
  titleArea: { flex: 1 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  subtitle: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  studyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  studyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: colors.light.foreground, fontFamily: "Inter_400Regular" },
  listContent: { paddingBottom: 120 },
  empty: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 15, color: colors.light.mutedForeground },
});
