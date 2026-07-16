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
import { HSK_LEVELS, HSK_WORDS } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress, learnedWords, streak } = useLearning();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalWords = HSK_WORDS.length;
  const totalLearned = learnedWords.length;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Thẻ học</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall progress */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.light.primary }]}>
            <Feather name="zap" size={22} color="#fff" />
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Ngày liên tiếp</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#43A047" }]}>
            <Feather name="check-circle" size={22} color="#fff" />
            <Text style={styles.statNum}>{totalLearned}</Text>
            <Text style={styles.statLabel}>Đã học</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#1E88E5" }]}>
            <Feather name="book-open" size={22} color="#fff" />
            <Text style={styles.statNum}>{totalWords}</Text>
            <Text style={styles.statLabel}>Tổng từ</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ôn tập theo cấp độ</Text>
        {HSK_LEVELS.map((lvl) => {
          const p = progress[lvl.level];
          const learned = p?.learned ?? 0;
          const levelWords = HSK_WORDS.filter((w) => w.hskLevel === lvl.level);
          const total = levelWords.length;
          const pct = total > 0 ? learned / total : 0;

          return (
            <TouchableOpacity
              key={lvl.level}
              style={styles.levelCard}
              onPress={() => router.push({ pathname: "/study/[level]", params: { level: lvl.level } })}
              activeOpacity={0.8}
            >
              <View style={[styles.levelIcon, { backgroundColor: lvl.color + "20" }]}>
                <Text style={[styles.levelIconText, { color: lvl.color }]}>{lvl.level}</Text>
              </View>
              <View style={styles.levelInfo}>
                <View style={styles.levelTop}>
                  <Text style={styles.levelName}>{lvl.name}</Text>
                  <Text style={styles.levelCount}>{learned}/{total} từ</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: lvl.color }]} />
                </View>
                <Text style={styles.levelDesc}>{lvl.description}</Text>
              </View>
              <Feather name="play-circle" size={28} color={lvl.color} />
            </TouchableOpacity>
          );
        })}

        {/* Saved words */}
        <TouchableOpacity
          style={styles.savedCard}
          onPress={() => router.push({ pathname: "/saved" as any })}
          activeOpacity={0.8}
        >
          <View style={[styles.savedIcon, { backgroundColor: "#E91E6320" }]}>
            <Feather name="bookmark" size={22} color="#E91E63" />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelName}>Từ đã lưu</Text>
            <Text style={styles.levelDesc}>Ôn lại các từ bạn đánh dấu</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.light.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28, marginTop: 4 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statNum: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontFamily: "Inter_500Medium", textAlign: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 14 },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 14,
  },
  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  levelIconText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  levelInfo: { flex: 1, gap: 6 },
  levelTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  levelName: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  levelCount: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  progressTrack: {
    height: 5,
    backgroundColor: colors.light.muted,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  levelDesc: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 14,
  },
  savedIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
});
